from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from users.permissions import IsManagerOrAdmin
import csv
from django.http import HttpResponse
import io
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.mail import send_mail # <--- Import để gửi mail

from .models import Customer, PipelineStage, Opportunity, Activity, Task, Product, OpportunityItem
from .serializers import (
    CustomerSerializer, PipelineStageSerializer, 
    OpportunitySerializer, ActivitySerializer, TaskSerializer, ProductSerializer,
    OpportunityItemSerializer
)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Customer.objects.all()
        query = self.request.query_params.get('search')
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(email__icontains=query) | Q(phone__icontains=query))
        return queryset

class PipelineStageViewSet(viewsets.ModelViewSet):
    queryset = PipelineStage.objects.all()
    serializer_class = PipelineStageSerializer
    permission_classes = [IsManagerOrAdmin]

class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # --- [NÂNG CẤP] AUDIT LOG & AUTO STATUS ---
    def perform_update(self, serializer):
        # 1. Lấy dữ liệu cũ trước khi lưu
        old_instance = self.get_object()
        old_status = old_instance.status
        old_stage = old_instance.stage
        old_value = old_instance.value

        # 2. Lưu dữ liệu mới
        instance = serializer.save()
        
        # 3. Ghi Log thay đổi (Audit Log)
        changes = []
        if old_status != instance.status:
            changes.append(f"Trạng thái: {old_status} -> {instance.status}")
        if old_stage != instance.stage:
            changes.append(f"Giai đoạn: {old_stage.name} -> {instance.stage.name}")
        if old_value != instance.value:
            changes.append(f"Giá trị: {old_value:,.0f} -> {instance.value:,.0f}")

        if changes:
            Activity.objects.create(
                opportunity=instance,
                user=self.request.user,
                type='NOTE', # Dùng loại NOTE để ghi log hệ thống
                summary=f"🔴 Cập nhật hệ thống: {'; '.join(changes)}"
            )

        # 4. Logic tự động cập nhật Status theo Stage (như cũ)
        if instance.stage:
            stage_type = instance.stage.type
            if stage_type == 'WON' and instance.status != 'WON':
                instance.status = 'WON'
                instance.save()
            elif stage_type == 'LOST' and instance.status != 'LOST':
                instance.status = 'LOST'
                instance.save()
            elif stage_type == 'OPEN' and instance.status in ['WON', 'LOST']:
                instance.status = 'OPEN'
                instance.save()

    def get_queryset(self):
        user = self.request.user
        queryset = Opportunity.objects.all()
        if user.role == 'REP':
            queryset = queryset.filter(owner=user)
        
        query = self.request.query_params.get('search')
        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(customer__name__icontains=query))
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(stage_id=stage)
        customer = self.request.query_params.get('customer')
        if customer:
            queryset = queryset.filter(customer_id=customer)
        owner = self.request.query_params.get('owner')
        if owner:
            queryset = queryset.filter(owner_id=owner)
        return queryset

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_queryset(self):
        user = self.request.user
        queryset = Activity.objects.all()
        opportunity_id = self.request.query_params.get('opportunity')
        if opportunity_id:
            queryset = queryset.filter(opportunity_id=opportunity_id)
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(opportunity__customer_id=customer_id)
        if user.role == 'REP':
             return queryset.filter(opportunity__owner=user)
        return queryset

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    # --- [NÂNG CẤP] GỬI EMAIL THÔNG BÁO ---
    def perform_create(self, serializer):
        task = serializer.save(assigned_to=self.request.user)
        
        # Gửi email thông báo
        try:
            send_mail(
                subject=f"Công việc mới: {task.title}",
                message=f"Bạn vừa tạo một công việc mới trên CRM.\nHạn chót: {task.due_date}\nƯu tiên: {task.get_priority_display()}",
                from_email=None, # Dùng mặc định trong settings
                recipient_list=[self.request.user.email],
                fail_silently=True
            )
        except Exception as e:
            print("Lỗi gửi mail:", e)

    def get_queryset(self):
        queryset = Task.objects.filter(assigned_to=self.request.user)
        opp_id = self.request.query_params.get('opportunity')
        if opp_id:
            queryset = queryset.filter(opportunity_id=opp_id)
        return queryset

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsManagerOrAdmin()]

class OpportunityItemViewSet(viewsets.ModelViewSet):
    queryset = OpportunityItem.objects.all()
    serializer_class = OpportunityItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = OpportunityItem.objects.all()
        opp_id = self.request.query_params.get('opportunity')
        if opp_id:
            queryset = queryset.filter(opportunity_id=opp_id)
        return queryset

    def update_opportunity_value(self, opportunity):
        total = opportunity.items.aggregate(
            total=Sum(F('quantity') * F('unit_price'), output_field=models.DecimalField())
        )['total'] or 0
        opportunity.value = total
        opportunity.save()

    def perform_create(self, serializer):
        item = serializer.save()
        self.update_opportunity_value(item.opportunity)

    def perform_update(self, serializer):
        item = serializer.save()
        self.update_opportunity_value(item.opportunity)

    def perform_destroy(self, instance):
        opportunity = instance.opportunity
        instance.delete()
        self.update_opportunity_value(opportunity)

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role == 'REP':
            opps = Opportunity.objects.filter(owner=user)
        else:
            opps = Opportunity.objects.all()

        # KPIs
        revenue_deals = opps.filter(status__in=['OPEN', 'WON'])
        expected_revenue = revenue_deals.aggregate(total=Sum('value'))['total'] or 0
        open_deals_count = opps.filter(status='OPEN').count()
        
        last_30_days = timezone.now() - timedelta(days=30)
        new_customers_count = Customer.objects.filter(created_at__gte=last_30_days).count()

        won_count = opps.filter(status='WON').count()
        closed_count = won_count + opps.filter(status='LOST').count()
        win_rate = round((won_count / closed_count) * 100, 1) if closed_count > 0 else 0

        # Chart Data (Manager) - Doanh thu theo Giai đoạn
        chart_data = opps.filter(status='OPEN').values('stage__name').annotate(total=Sum('value')).order_by('total')
        revenue_by_stage = [{"name": i['stage__name'], "value": i['total']} for i in chart_data]

        # Upcoming Deals
        upcoming_deals = opps.filter(status='OPEN', expected_close_date__gte=timezone.now().date()).order_by('expected_close_date')[:5].values('id', 'title', 'expected_close_date', 'value')

        # My Tasks
        my_tasks = Task.objects.filter(assigned_to=user, is_completed=False).order_by('due_date')[:5]
        tasks_data = TaskSerializer(my_tasks, many=True).data

        # --- [CẬP NHẬT] BIỂU ĐỒ HIỆU SUẤT (CÓ BỘ LỌC THÁNG) ---
        # Lấy số tháng từ tham số URL (mặc định 6 tháng)
        try:
            months = int(request.query_params.get('months', 6))
        except ValueError:
            months = 6
            
        start_date = timezone.now() - timedelta(days=months * 30)
        
        monthly_sales = opps.filter(status='WON', updated_at__gte=start_date)\
            .annotate(month=TruncMonth('updated_at'))\
            .values('month')\
            .annotate(total=Sum('value'))\
            .order_by('month')
        
        rep_performance = [
            {"month": m['month'].strftime('%m/%Y'), "sales": m['total']} 
            for m in monthly_sales
        ]

        return Response({
            "expected_revenue": expected_revenue,
            "open_deals_count": open_deals_count,
            "new_customers_count": new_customers_count,
            "win_rate": win_rate,
            "revenue_by_stage": revenue_by_stage,
            "upcoming_deals": upcoming_deals,
            "my_tasks": tasks_data,
            "rep_performance": rep_performance,
        })
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        
        # 1. Scope dữ liệu
        if user.role == 'REP':
            opps = Opportunity.objects.filter(owner=user)
        else:
            opps = Opportunity.objects.all()

        # 2. KPIs
        revenue_deals = opps.filter(status__in=['OPEN', 'WON'])
        expected_revenue = revenue_deals.aggregate(total=Sum('value'))['total'] or 0
        open_deals_count = opps.filter(status='OPEN').count()
        
        last_30_days = timezone.now() - timedelta(days=30)
        new_customers_count = Customer.objects.filter(created_at__gte=last_30_days).count()

        won_count = opps.filter(status='WON').count()
        closed_count = won_count + opps.filter(status='LOST').count()
        win_rate = round((won_count / closed_count) * 100, 1) if closed_count > 0 else 0

        # 3. Chart Data (Manager) - Doanh thu theo Giai đoạn
        chart_data = opps.filter(status='OPEN').values('stage__name').annotate(total=Sum('value')).order_by('total')
        revenue_by_stage = [{"name": i['stage__name'], "value": i['total']} for i in chart_data]

        # 4. Upcoming Deals
        upcoming_deals = opps.filter(status='OPEN', expected_close_date__gte=timezone.now().date()).order_by('expected_close_date')[:5].values('id', 'title', 'expected_close_date', 'value')

        # 5. My Tasks
        my_tasks = Task.objects.filter(assigned_to=user, is_completed=False).order_by('due_date')[:5]
        tasks_data = TaskSerializer(my_tasks, many=True).data

        # --- [MỚI] BIỂU ĐỒ HIỆU SUẤT CÁ NHÂN (REP PERFORMANCE) ---
        # Thống kê doanh số WON trong 6 tháng gần nhất
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_sales = opps.filter(status='WON', updated_at__gte=six_months_ago)\
            .annotate(month=TruncMonth('updated_at'))\
            .values('month')\
            .annotate(total=Sum('value'))\
            .order_by('month')
        
        rep_performance = [
            {"month": m['month'].strftime('%m/%Y'), "sales": m['total']} 
            for m in monthly_sales
        ]

        return Response({
            "expected_revenue": expected_revenue,
            "open_deals_count": open_deals_count,
            "new_customers_count": new_customers_count,
            "win_rate": win_rate,
            "revenue_by_stage": revenue_by_stage,
            "upcoming_deals": upcoming_deals,
            "my_tasks": tasks_data,
            "rep_performance": rep_performance, # <--- Dữ liệu mới
        })
    
class ExportOpportunityView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        if user.role == 'REP':
            queryset = Opportunity.objects.filter(owner=user)
        else:
            queryset = Opportunity.objects.all()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="opportunities_export.csv"'
        response.write(u'\ufeff'.encode('utf8')) 
        writer = csv.writer(response)
        writer.writerow(['ID', 'Tên Giao dịch', 'Khách hàng', 'Giá trị', 'Ngày đóng', 'Giai đoạn', 'Trạng thái', 'Người phụ trách', 'Ngày tạo'])
        for opp in queryset:
            writer.writerow([
                str(opp.id), opp.title, opp.customer.name if opp.customer else '', opp.value,
                opp.expected_close_date, opp.stage.name if opp.stage else '',
                opp.get_status_display(), opp.owner.username if opp.owner else '',
                opp.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            ])
        return response
    
class ImportCustomerView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request):
        if 'file' not in request.FILES: return Response({"error": "Chưa chọn file"}, status=400)
        file = request.FILES['file']
        if not file.name.endswith('.csv'): return Response({"error": "Vui lòng upload file định dạng .csv"}, status=400)
        try:
            decoded_file = file.read().decode('utf-8-sig')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            count = 0
            errors = []
            for index, row in enumerate(reader):
                try:
                    name = row.get('Tên Khách hàng') or row.get('name')
                    email = row.get('Email') or row.get('email')
                    phone = row.get('SĐT') or row.get('phone')
                    if not name: continue
                    obj, created = Customer.objects.get_or_create(email=email, defaults={'name': name, 'phone': phone})
                    if created: count += 1
                except Exception as e: errors.append(f"Dòng {index + 2}: {str(e)}")
            return Response({"message": f"Đã nhập thành công {count} khách hàng.", "errors": errors})
        except Exception as e: return Response({"error": f"Lỗi đọc file: {str(e)}"}, status=400)
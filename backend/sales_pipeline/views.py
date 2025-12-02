from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse
import io
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Customer, PipelineStage, Opportunity, Activity, Task, Product, OpportunityItem
from .serializers import (
    CustomerSerializer, PipelineStageSerializer, 
    OpportunitySerializer, ActivitySerializer, TaskSerializer, ProductSerializer, OpportunityItemSerializer
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
    permission_classes = [permissions.IsAuthenticated]

class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.stage:
            stage_type = instance.stage.type
            if stage_type == 'WON':
                if instance.status != 'WON':
                    instance.status = 'WON'
                    instance.save()
            elif stage_type == 'LOST':
                if instance.status != 'LOST':
                    instance.status = 'LOST'
                    instance.save()
            else:
                if instance.status in ['WON', 'LOST']:
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

    def perform_create(self, serializer):
        serializer.save(assigned_to=self.request.user)

    def get_queryset(self):
        queryset = Task.objects.filter(assigned_to=self.request.user)
        opp_id = self.request.query_params.get('opportunity')
        if opp_id:
            queryset = queryset.filter(opportunity_id=opp_id)
        return queryset

# --- [MỚI] Product ViewSet ---
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Product.objects.all()
        # Lọc sản phẩm đang kinh doanh
        active = self.request.query_params.get('active')
        if active == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset

# --- [MỚI] API Quản lý Sản phẩm trong Giao dịch ---
class OpportunityItemViewSet(viewsets.ModelViewSet):
    queryset = OpportunityItem.objects.all()
    serializer_class = OpportunityItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = OpportunityItem.objects.all()
        # Lọc theo Opportunity ID (để hiển thị trong trang chi tiết)
        opp_id = self.request.query_params.get('opportunity')
        if opp_id:
            queryset = queryset.filter(opportunity_id=opp_id)
        return queryset
    # Hàm phụ trợ để tính lại tổng tiền
    def update_opportunity_value(self, opportunity):
        # Tính tổng tiền các items
        total = opportunity.items.aggregate(
            total=Sum(F('quantity') * F('unit_price'), output_field=models.DecimalField())
        )['total'] or 0
        
        # Cập nhật vào Opportunity
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
        revenue_deals = opps.filter(status__in=['OPEN', 'WON'])
        expected_revenue = revenue_deals.aggregate(total=Sum('value'))['total'] or 0
        open_deals_count = opps.filter(status='OPEN').count()
        last_30_days = timezone.now() - timedelta(days=30)
        new_customers_count = Customer.objects.filter(created_at__gte=last_30_days).count()
        won_count = opps.filter(status='WON').count()
        closed_count = won_count + opps.filter(status='LOST').count()
        win_rate = round((won_count / closed_count) * 100, 1) if closed_count > 0 else 0
        chart_data = opps.filter(status='OPEN').values('stage__name').annotate(total=Sum('value')).order_by('total')
        revenue_by_stage = [{"name": i['stage__name'], "value": i['total']} for i in chart_data]
        upcoming_deals = opps.filter(status='OPEN', expected_close_date__gte=timezone.now().date()).order_by('expected_close_date')[:5].values('id', 'title', 'expected_close_date', 'value')
        my_tasks = Task.objects.filter(assigned_to=user, is_completed=False).order_by('due_date')[:5]
        tasks_data = TaskSerializer(my_tasks, many=True).data
        return Response({
            "expected_revenue": expected_revenue,
            "open_deals_count": open_deals_count,
            "new_customers_count": new_customers_count,
            "win_rate": win_rate,
            "revenue_by_stage": revenue_by_stage,
            "upcoming_deals": upcoming_deals,
            "my_tasks": tasks_data,
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
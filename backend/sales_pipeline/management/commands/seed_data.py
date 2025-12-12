import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from sales_pipeline.models import Customer, PipelineStage, Opportunity, Product, OpportunityItem, Activity, Task
from users.models import CustomUser

class Command(BaseCommand):
    help = 'Tự động sinh dữ liệu mẫu (Đã sửa lỗi tính tổng tiền Deal)'

    def handle(self, *args, **kwargs):
        self.stdout.write("--- 1. XÓA DỮ LIỆU CŨ ---")
        Task.objects.all().delete()
        Activity.objects.all().delete()
        OpportunityItem.objects.all().delete()
        Opportunity.objects.all().delete()
        Customer.objects.all().delete()
        Product.objects.all().delete()
        PipelineStage.objects.all().delete()
        CustomUser.objects.exclude(is_superuser=True).delete()

        self.stdout.write("--- 2. TẠO USER & DANH MỤC ---")

        # Tạo User
        manager = CustomUser.objects.create_user(username='manager', email='manager@test.com', password='password123', role='MANAGER')
        rep1 = CustomUser.objects.create_user(username='sales_a', email='a@test.com', password='password123', role='REP')
        rep2 = CustomUser.objects.create_user(username='sales_b', email='b@test.com', password='password123', role='REP')
        owners = [manager, rep1, rep2]

        # Tạo Giai đoạn
        stages_data = [
            (1, "Mới (New)", "OPEN"), (2, "Đang liên hệ", "OPEN"),
            (3, "Trình bày giải pháp", "OPEN"), (4, "Đàm phán", "OPEN"),
            (5, "Chốt thành công (Won)", "WON"), (6, "Thất bại (Lost)", "LOST"),
        ]
        stages_map = {'OPEN': [], 'WON': [], 'LOST': []}
        for order, name, s_type in stages_data:
            s = PipelineStage.objects.create(name=name, order=order, type=s_type)
            stages_map[s_type].append(s)

        # Tạo Sản phẩm & Khách hàng
        products_data = [("Gói Basic", "SP1", 5e6), ("Gói Pro", "SP2", 15e6), ("Gói Enterprise", "SP3", 50e6)]
        product_objs = [Product.objects.create(name=n, code=c, price=p) for n, c, p in products_data]
        
        customers = []
        for i in range(50):
            customers.append(Customer.objects.create(name=f"Khách hàng {i+1}", email=f"kh{i}@test.com", phone=f"090{i:07d}"))

        self.stdout.write("--- 3. TẠO CƠ HỘI & DOANH SỐ ---")
        
        # Cấu hình số lượng cố định
        status_list = ['WON'] * 30 + ['LOST'] * 20 + ['OPEN'] * 50
        random.shuffle(status_list)

        for i, target_status in enumerate(status_list):
            owner = owners[i % len(owners)] # Chia đều deal
            customer = random.choice(customers)
            stage = random.choice(stages_map[target_status])
            
            # Logic lý do thua
            lost_code = random.choice(['PRICE', 'COMPETITOR']) if target_status == 'LOST' else None
            lost_reason = "Giá cao hơn đối thủ" if lost_code == 'PRICE' else None

            # Random ngày
            days_ago = random.randint(0, 180)
            created_date = timezone.now() - timedelta(days=days_ago)
            
            opp = Opportunity.objects.create(
                title=f"Deal #{i+1} - {customer.name}",
                value=0, # Giá trị tạm thời
                expected_close_date=timezone.now().date() + timedelta(days=random.randint(5, 30)),
                status=target_status, stage=stage, owner=owner, customer=customer,
                lost_reason=lost_reason, lost_reason_code=lost_code
            )
            # Hack ngày tạo để test biểu đồ
            opp.created_at = created_date
            opp.updated_at = created_date
            opp.save()

            # --- [ĐÃ SỬA] THÊM SẢN PHẨM & TÍNH TỔNG TIỀN ---
            prod = random.choice(product_objs)
            qty = random.randint(1, 3) # Random số lượng từ 1 đến 3
            
            OpportunityItem.objects.create(
                opportunity=opp, 
                product=prod, 
                quantity=qty, 
                unit_price=prod.price
            )
            
            # Cập nhật Value = Đơn giá * Số lượng
            opp.value = prod.price * qty 
            opp.save()
            # -----------------------------------------------

        self.stdout.write("--- 4. TẠO VIỆC GẤP (CHO DASHBOARD) ---")
        
        for user in owners:
            my_open_opps = Opportunity.objects.filter(owner=user, status='OPEN')
            # 5 việc gấp
            for idx, opp in enumerate(my_open_opps[:5]):
                Task.objects.create(
                    opportunity=opp, assigned_to=user, 
                    title=f"🔥 GẤP: Gọi lại chốt đơn #{opp.id}", 
                    due_date=timezone.now() + timedelta(hours=idx*2), 
                    priority='HIGH', is_completed=False
                )

        self.stdout.write(self.style.SUCCESS("--- HOÀN TẤT! DỮ LIỆU ĐÃ CHUẨN ---"))
        self.stdout.write("Tài khoản Manager: manager / password123")
        self.stdout.write("Tài khoản Sales: sales_a / password123")
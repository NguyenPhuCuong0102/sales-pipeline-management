from django.db import models

from django.db import models
from django.conf import settings

# 1. Bảng Khách hàng
class Customer(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên khách hàng")
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# 2. Bảng Giai đoạn (Pipeline Stage)
class PipelineStage(models.Model):
    class Type(models.TextChoices):
        OPEN = 'OPEN', 'Đang xử lý (Open)'
        WON = 'WON', 'Thắng (Won)'
        LOST = 'LOST', 'Thua (Lost)'

    name = models.CharField(max_length=100, verbose_name="Tên giai đoạn")
    order = models.IntegerField(default=0, verbose_name="Thứ tự sắp xếp")
    # Trường mới để phân loại
    type = models.CharField(max_length=10, choices=Type.choices, default=Type.OPEN)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

# 3. Bảng Giao dịch (Opportunity) - QUAN TRỌNG NHẤT
class Opportunity(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Đang mở'
        WON = 'WON', 'Thắng (Thành công)'
        LOST = 'LOST', 'Thua (Thất bại)'

    title = models.CharField(max_length=255, verbose_name="Tên giao dịch")
    value = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Giá trị dự kiến")
    expected_close_date = models.DateField(verbose_name="Ngày đóng dự kiến")

    # Trạng thái & Giai đoạn
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    stage = models.ForeignKey(PipelineStage, on_delete=models.PROTECT, related_name='opportunities')
    lost_reason = models.TextField(blank=True, null=True, verbose_name="Lý do thất bại")

    # Ai phụ trách?
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='opportunities')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='opportunities')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    

    def __str__(self):
        return f"{self.title} - {self.value}"

# 4. Bảng Hoạt động (Activity)
class Activity(models.Model):
    class Type(models.TextChoices):
        CALL = 'CALL', 'Cuộc gọi'
        EMAIL = 'EMAIL', 'Email'
        MEETING = 'MEETING', 'Cuộc họp'
        NOTE = 'NOTE', 'Ghi chú'

    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=Type.choices)
    summary = models.TextField(verbose_name="Nội dung hoạt động")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at'] # Mới nhất lên đầu

class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = 'LOW', 'Thấp'
        MEDIUM = 'MEDIUM', 'Trung bình'
        HIGH = 'HIGH', 'Cao'

    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='tasks')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=255, verbose_name="Tiêu đề công việc")
    due_date = models.DateTimeField(verbose_name="Hạn chót")
    is_completed = models.BooleanField(default=False, verbose_name="Đã hoàn thành")
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date'] # Sắp xếp việc nào gấp làm trước

    def __str__(self):
        return self.title

class Product(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên sản phẩm")
    code = models.CharField(max_length=50, unique=True, verbose_name="Mã sản phẩm")
    price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Đơn giá niêm yết")
    description = models.TextField(blank=True, null=True, verbose_name="Mô tả")
    is_active = models.BooleanField(default=True, verbose_name="Đang kinh doanh")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"
    
    # 7. Chi tiết Giao dịch (Sản phẩm trong cơ hội) - [MỚI]
class OpportunityItem(models.Model):
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT) # Không xóa được SP nếu đã có đơn hàng
    
    quantity = models.IntegerField(default=1, verbose_name="Số lượng")
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Đơn giá thực bán")
    
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_price(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.opportunity.title} - {self.product.name}"
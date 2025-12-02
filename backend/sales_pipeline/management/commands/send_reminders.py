from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from sales_pipeline.models import Opportunity

class Command(BaseCommand):
    help = 'Gửi email nhắc nhở cho các cơ hội sắp hết hạn hôm nay'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        # Tìm các deal có ngày đóng là hôm nay hoặc mai và chưa xong
        opps = Opportunity.objects.filter(
            expected_close_date=today,
            status='OPEN'
        )

        for opp in opps:
            if opp.owner and opp.owner.email:
                print(f"Gửi mail cho {opp.owner.email} về deal {opp.title}")
                send_mail(
                    subject=f"Nhắc nhở: Deal '{opp.title}' đến hạn hôm nay!",
                    message=f"Xin chào {opp.owner.username},\n\nCơ hội bán hàng '{opp.title}' có ngày đóng dự kiến là hôm nay ({today}).\nVui lòng kiểm tra và cập nhật trạng thái.\n\nTrân trọng,\nCore CRM",
                    from_email=None,
                    recipient_list=[opp.owner.email],
                    fail_silently=True
                )
        
        self.stdout.write(self.style.SUCCESS(f'Đã gửi nhắc nhở cho {opps.count()} giao dịch.'))
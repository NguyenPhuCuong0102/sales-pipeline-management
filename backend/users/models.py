from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Quản trị viên'
        SALES_MANAGER = 'MANAGER', 'Trưởng phòng KD'
        SALES_REP = 'REP', 'Nhân viên KD'

    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.SALES_REP
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
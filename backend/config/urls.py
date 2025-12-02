from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints chính
    path('api/', include('sales_pipeline.urls')),

    # Thêm dòng này để kết nối API user
    path('api/auth/', include('users.urls')),
    
    # API xác thực (Login/Logout) mặc định của DRF
    path('api-auth/', include('rest_framework.urls')), 
]
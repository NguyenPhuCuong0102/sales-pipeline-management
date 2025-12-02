from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet, PipelineStageViewSet, OpportunityViewSet, 
    ActivityViewSet, DashboardStatsView, TaskViewSet,
    ExportOpportunityView, ImportCustomerView, ProductViewSet, OpportunityItemViewSet
)

# Router tự động sinh ra các đường dẫn như /opportunities/, /opportunities/1/ ...
router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'stages', PipelineStageViewSet)
router.register(r'opportunities', OpportunityViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'products', ProductViewSet)
router.register(r'opportunity-items', OpportunityItemViewSet)

urlpatterns = [
    # Ưu tiên các đường dẫn cụ thể lên trước router
    path('opportunities/export/', ExportOpportunityView.as_view(), name='opportunity_export'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('customers/import/', ImportCustomerView.as_view(), name='customer_import'),
    path('', include(router.urls)),
]
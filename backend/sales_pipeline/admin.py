from django.contrib import admin
from .models import Customer, PipelineStage, Opportunity, Activity

@admin.register(PipelineStage)
class StageAdmin(admin.ModelAdmin):
    list_display = ('name', 'order')

@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ('title', 'value', 'stage', 'status', 'owner')
    list_filter = ('stage', 'status', 'owner')

admin.site.register(Customer)
admin.site.register(Activity)
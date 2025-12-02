from rest_framework import serializers
# --- QUAN TRỌNG: Đã thêm Task vào dòng dưới đây ---
from .models import Customer, PipelineStage, Opportunity, Activity, Task
from users.models import CustomUser

# 1. Serializer cho User
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role']

# 2. Serializer cho Khách hàng
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

# 3. Serializer cho Giai đoạn
class PipelineStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PipelineStage
        fields = '__all__'

# 4. Serializer cho Giao dịch
class OpportunitySerializer(serializers.ModelSerializer):
    stage_name = serializers.ReadOnlyField(source='stage.name')
    owner_name = serializers.ReadOnlyField(source='owner.username')
    customer_name = serializers.ReadOnlyField(source='customer.name')
    
    customer_id = serializers.PrimaryKeyRelatedField(read_only=True, source='customer')
    stage_id = serializers.PrimaryKeyRelatedField(read_only=True, source='stage')

    class Meta:
        model = Opportunity
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']

# 5. Serializer cho Hoạt động
class ActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Activity
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

# 6. Serializer cho Công việc (Task) - MỚI
class TaskSerializer(serializers.ModelSerializer):
    opportunity_name = serializers.ReadOnlyField(source='opportunity.title')
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['assigned_to', 'created_at']
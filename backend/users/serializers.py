from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth import get_user_model

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'password', 'email', 'role')

    def create(self, validated_data):
        # Hàm này sẽ được gọi khi dữ liệu hợp lệ
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'REP') # Mặc định là Sales Rep
        )
        return user
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mật khẩu cũ không chính xác.")
        return value
    
# 1. Serializer Yêu cầu Reset (Nhập Email)
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Kiểm tra email có tồn tại không
        if not CustomUser.objects.filter(email=value).exists():
            # Vì lý do bảo mật, ta vẫn return value mà không báo lỗi "Email không tồn tại"
            # để tránh hacker dò email. Nhưng ở đây ta cứ return để xử lý logic.
            return value 
        return value

# 2. Serializer Xác nhận Reset (Nhập Pass mới + Token)
class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=6, write_only=True)

    def validate(self, attrs):
        # Giải mã UID để tìm User
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = get_user_model().objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
            raise serializers.ValidationError("Link không hợp lệ hoặc đã hết hạn.")

        # Kiểm tra Token có đúng không
        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError("Token không hợp lệ hoặc đã hết hạn.")

        attrs['user'] = user
        return attrs
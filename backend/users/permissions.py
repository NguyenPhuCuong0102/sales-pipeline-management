from rest_framework import permissions

class IsManagerOrAdmin(permissions.BasePermission):
    """
    Chỉ cho phép Manager hoặc Admin truy cập.
    """
    def has_permission(self, request, view):
        # Phải đăng nhập và có role là MANAGER hoặc ADMIN
        return bool(request.user and request.user.is_authenticated and request.user.role in ['MANAGER', 'ADMIN'])
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to ADMIN users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsEmployee(BasePermission):
    """Allow access only to EMPLOYEE users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "EMPLOYEE"
        )


class IsHROrAdmin(BasePermission):
    """Allow access to ADMIN or HR_OFFICER users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "HR_OFFICER"]
        )


class IsPayrollOrAdmin(BasePermission):
    """Allow access to ADMIN or PAYROLL_OFFICER users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "PAYROLL_OFFICER"]
        )


class IsHROrPayrollOrAdmin(BasePermission):
    """Allow access to ADMIN, HR_OFFICER, or PAYROLL_OFFICER users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "HR_OFFICER", "PAYROLL_OFFICER"]
        )

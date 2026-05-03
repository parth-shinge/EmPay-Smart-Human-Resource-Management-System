"""
URL configuration for EmPay project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from apps.accounts.views import (
    EmployeeListCreateView,
    EmployeeDetailView,
    EmployeeDirectoryView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # Auth endpoints → /api/auth/register/, /api/auth/login/, etc.
    path("api/auth/", include("apps.accounts.urls")),
    # Employee management endpoints → /api/employees/
    path("api/employees/", EmployeeListCreateView.as_view(), name="employee-list-create"),
    path("api/employees/directory/", EmployeeDirectoryView.as_view(), name="employee-directory"),
    path("api/employees/<int:pk>/", EmployeeDetailView.as_view(), name="employee-detail"),
    # Placeholder includes for other apps
    path("api/", include("apps.attendance.urls")),
    path("api/", include("apps.leave.urls")),
    path("api/", include("apps.payroll.urls")),
    path("api/", include("apps.dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

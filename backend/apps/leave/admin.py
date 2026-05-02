from django.contrib import admin

from .models import LeaveAllocation, LeaveRequest, LeaveType


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "max_days_per_year", "is_paid")
    list_filter = ("is_paid", "organization")
    search_fields = ("name",)


@admin.register(LeaveAllocation)
class LeaveAllocationAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "leave_type",
        "allocated_days",
        "used_days",
        "year",
    )
    list_filter = ("year", "leave_type")
    search_fields = ("employee__name", "employee__email")
    raw_id_fields = ("employee",)


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "leave_type",
        "start_date",
        "end_date",
        "total_days",
        "status",
        "reviewed_by",
    )
    list_filter = ("status", "leave_type")
    search_fields = ("employee__name", "employee__email")
    raw_id_fields = ("employee", "reviewed_by")
    ordering = ("-start_date",)

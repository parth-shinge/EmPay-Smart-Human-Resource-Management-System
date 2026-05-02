from django.contrib import admin

from .models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "date",
        "check_in",
        "check_out",
        "status",
        "working_hours",
    )
    list_filter = ("status", "date")
    search_fields = ("employee__name", "employee__email")
    ordering = ("-date",)
    raw_id_fields = ("employee",)

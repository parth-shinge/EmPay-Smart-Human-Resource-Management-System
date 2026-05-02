from django.contrib import admin

from .models import Payrun, Payslip, SalaryStructure


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "basic_salary",
        "hra",
        "transport_allowance",
        "pf_percentage",
        "professional_tax",
    )
    search_fields = ("employee__name", "employee__email")
    raw_id_fields = ("employee",)


@admin.register(Payrun)
class PayrunAdmin(admin.ModelAdmin):
    list_display = ("month", "year", "organization", "status", "created_by", "processed_at")
    list_filter = ("status", "year")
    raw_id_fields = ("created_by",)


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = (
        "employee",
        "payrun",
        "working_days",
        "present_days",
        "leave_days",
        "gross_salary",
        "total_deductions",
        "net_salary",
        "status",
    )
    list_filter = ("status", "payrun")
    search_fields = ("employee__name", "employee__email")
    raw_id_fields = ("employee", "payrun")

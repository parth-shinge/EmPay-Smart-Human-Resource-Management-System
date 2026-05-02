from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Payrun, PayrunStatus, Payslip, SalaryStructure


# ---------------------------------------------------------------------------
# SalaryStructure Serializer (full CRUD)
# ---------------------------------------------------------------------------
class SalaryStructureSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_email = serializers.CharField(source="employee.email", read_only=True)

    class Meta:
        model = SalaryStructure
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_email",
            "basic_salary",
            "hra",
            "transport_allowance",
            "other_allowances",
            "pf_percentage",
            "professional_tax",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_employee(self, value):
        """Prevent duplicate salary structures on create."""
        if self.instance is None:  # only on create
            if SalaryStructure.objects.filter(employee=value).exists():
                raise serializers.ValidationError(
                    "Salary structure already exists for this employee."
                )
        return value


# ---------------------------------------------------------------------------
# Payrun Serializer (read, with payslip_count)
# ---------------------------------------------------------------------------
class PayrunSerializer(serializers.ModelSerializer):
    payslip_count = serializers.IntegerField(read_only=True, default=0)
    created_by_name = serializers.CharField(
        source="created_by.name", read_only=True, default=None
    )

    class Meta:
        model = Payrun
        fields = [
            "id",
            "organization",
            "month",
            "year",
            "status",
            "created_by",
            "created_by_name",
            "created_at",
            "processed_at",
            "payslip_count",
        ]
        read_only_fields = [
            "id",
            "organization",
            "status",
            "created_by",
            "created_at",
            "processed_at",
        ]


# ---------------------------------------------------------------------------
# Payrun Create Serializer
# ---------------------------------------------------------------------------
class PayrunCreateSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020, max_value=2100)

    def validate(self, attrs):
        user = self.context["request"].user
        if Payrun.objects.filter(
            organization=user.organization,
            month=attrs["month"],
            year=attrs["year"],
        ).exists():
            raise serializers.ValidationError(
                {"detail": "Payrun for this month already exists."}
            )
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        payrun = Payrun.objects.create(
            organization=user.organization,
            month=validated_data["month"],
            year=validated_data["year"],
            created_by=user,
        )
        return payrun

    def to_representation(self, instance):
        return PayrunSerializer(instance).data


# ---------------------------------------------------------------------------
# Payslip Serializer (full detail)
# ---------------------------------------------------------------------------
class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_email = serializers.CharField(source="employee.email", read_only=True)
    employee_department = serializers.CharField(
        source="employee.department", read_only=True
    )
    payrun_month = serializers.IntegerField(source="payrun.month", read_only=True)
    payrun_year = serializers.IntegerField(source="payrun.year", read_only=True)
    payrun_status = serializers.CharField(source="payrun.status", read_only=True)

    class Meta:
        model = Payslip
        fields = [
            "id",
            "payrun",
            "employee",
            "employee_name",
            "employee_email",
            "employee_department",
            "payrun_month",
            "payrun_year",
            "payrun_status",
            "working_days",
            "present_days",
            "leave_days",
            "basic_salary",
            "hra",
            "transport_allowance",
            "other_allowances",
            "gross_salary",
            "pf_deduction",
            "professional_tax",
            "other_deductions",
            "total_deductions",
            "net_salary",
            "status",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Payslip Summary Serializer (compact for lists)
# ---------------------------------------------------------------------------
class PayslipSummarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_email = serializers.CharField(source="employee.email", read_only=True)
    payrun_month = serializers.IntegerField(source="payrun.month", read_only=True)
    payrun_year = serializers.IntegerField(source="payrun.year", read_only=True)

    class Meta:
        model = Payslip
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_email",
            "payrun_month",
            "payrun_year",
            "working_days",
            "present_days",
            "leave_days",
            "gross_salary",
            "total_deductions",
            "net_salary",
            "status",
        ]
        read_only_fields = fields

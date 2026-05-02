from datetime import date, timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from .models import (
    LeaveAllocation,
    LeaveRequest,
    LeaveStatus,
    LeaveType,
)


# ---------------------------------------------------------------------------
# LeaveType Serializer
# ---------------------------------------------------------------------------
class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "name", "max_days_per_year", "is_paid"]
        read_only_fields = ["id"]


# ---------------------------------------------------------------------------
# LeaveAllocation Serializer
# ---------------------------------------------------------------------------
class LeaveAllocationSerializer(serializers.ModelSerializer):
    remaining_days = serializers.IntegerField(read_only=True)
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)

    class Meta:
        model = LeaveAllocation
        fields = [
            "id",
            "employee",
            "employee_name",
            "leave_type",
            "leave_type_name",
            "allocated_days",
            "used_days",
            "remaining_days",
            "year",
        ]
        read_only_fields = ["id", "used_days", "remaining_days"]


# ---------------------------------------------------------------------------
# Leave Balance Serializer (summary for an employee)
# ---------------------------------------------------------------------------
class LeaveBalanceSerializer(serializers.Serializer):
    leave_type = serializers.CharField(source="leave_type__name")
    allocated = serializers.IntegerField(source="allocated_days")
    used = serializers.IntegerField(source="used_days")
    remaining = serializers.IntegerField()


# ---------------------------------------------------------------------------
# LeaveRequest Serializer (full detail, read-focused)
# ---------------------------------------------------------------------------
class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_email = serializers.CharField(source="employee.email", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_email",
            "leave_type",
            "leave_type_name",
            "start_date",
            "end_date",
            "total_days",
            "reason",
            "status",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "rejection_reason",
        ]
        read_only_fields = [
            "id",
            "employee",
            "total_days",
            "status",
            "reviewed_by",
            "reviewed_at",
        ]

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.name
        return None


# ---------------------------------------------------------------------------
# LeaveRequest Create Serializer
# ---------------------------------------------------------------------------
class LeaveRequestCreateSerializer(serializers.Serializer):
    leave_type = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    reason = serializers.CharField()

    def validate_start_date(self, value):
        if value < date.today():
            raise serializers.ValidationError(
                "Start date cannot be in the past."
            )
        return value

    def validate(self, attrs):
        start_date = attrs["start_date"]
        end_date = attrs["end_date"]

        if end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after start date."}
            )

        # Resolve leave type
        employee = self.context["request"].user
        try:
            leave_type = LeaveType.objects.get(
                id=attrs["leave_type"],
                organization=employee.organization,
            )
        except LeaveType.DoesNotExist:
            raise serializers.ValidationError(
                {"leave_type": "Invalid leave type."}
            )
        attrs["leave_type_obj"] = leave_type

        # Calculate requested weekdays
        requested_days = 0
        current = start_date
        while current <= end_date:
            if current.weekday() < 5:
                requested_days += 1
            current += timedelta(days=1)

        if requested_days == 0:
            raise serializers.ValidationError(
                "Selected dates contain no working days."
            )

        # Check leave balance
        current_year = start_date.year
        try:
            allocation = LeaveAllocation.objects.get(
                employee=employee,
                leave_type=leave_type,
                year=current_year,
            )
        except LeaveAllocation.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "No leave allocation found for this leave type and year."}
            )

        if allocation.remaining_days < requested_days:
            raise serializers.ValidationError(
                {"detail": "Insufficient leave balance."}
            )

        # Check overlapping pending/approved requests
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=[LeaveStatus.PENDING, LeaveStatus.APPROVED],
            start_date__lte=end_date,
            end_date__gte=start_date,
        )
        if overlapping.exists():
            raise serializers.ValidationError(
                {"detail": "You have an overlapping leave request for these dates."}
            )

        attrs["requested_days"] = requested_days
        return attrs

    def create(self, validated_data):
        employee = self.context["request"].user
        leave_type = validated_data["leave_type_obj"]

        request_obj = LeaveRequest(
            employee=employee,
            leave_type=leave_type,
            start_date=validated_data["start_date"],
            end_date=validated_data["end_date"],
            reason=validated_data["reason"],
        )
        request_obj.save()  # save() auto-calculates total_days
        return request_obj

    def to_representation(self, instance):
        return LeaveRequestSerializer(instance).data


# ---------------------------------------------------------------------------
# Leave Decision Serializer (Approve / Reject)
# ---------------------------------------------------------------------------
class LeaveDecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[LeaveStatus.APPROVED, LeaveStatus.REJECTED]
    )
    rejection_reason = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    def validate(self, attrs):
        if (
            attrs["status"] == LeaveStatus.REJECTED
            and not attrs.get("rejection_reason", "").strip()
        ):
            raise serializers.ValidationError(
                {"rejection_reason": "Rejection reason is required when rejecting."}
            )
        return attrs

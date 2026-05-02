from datetime import date

from django.utils import timezone
from rest_framework import serializers

from .models import AttendanceRecord, AttendanceStatus


# ---------------------------------------------------------------------------
# Full detail serializer
# ---------------------------------------------------------------------------
class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_email = serializers.CharField(source="employee.email", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_email",
            "date",
            "check_in",
            "check_out",
            "status",
            "working_hours",
            "notes",
        ]
        read_only_fields = ["id", "employee", "date", "working_hours"]


# ---------------------------------------------------------------------------
# Check-In serializer
# ---------------------------------------------------------------------------
class CheckInSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        employee = self.context["request"].user
        today = timezone.localdate()

        # No duplicate check-in for today
        if AttendanceRecord.objects.filter(employee=employee, date=today).exists():
            raise serializers.ValidationError(
                {"detail": "Already checked in today."}
            )

        return attrs

    def create(self, validated_data):
        employee = self.context["request"].user
        today = timezone.localdate()
        now_time = timezone.localtime().time()

        record = AttendanceRecord.objects.create(
            employee=employee,
            date=today,
            check_in=now_time,
            status=AttendanceStatus.PRESENT,
            notes=validated_data.get("notes", ""),
        )
        return record

    def to_representation(self, instance):
        return AttendanceRecordSerializer(instance).data


# ---------------------------------------------------------------------------
# Check-Out serializer
# ---------------------------------------------------------------------------
class CheckOutSerializer(serializers.Serializer):

    def validate(self, attrs):
        employee = self.context["request"].user
        today = timezone.localdate()

        try:
            record = AttendanceRecord.objects.get(employee=employee, date=today)
        except AttendanceRecord.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "No check-in found for today."}
            )

        if record.check_out is not None:
            raise serializers.ValidationError(
                {"detail": "Already checked out today."}
            )

        attrs["record"] = record
        return attrs

    def update_record(self, validated_data):
        record = validated_data["record"]
        now_time = timezone.localtime().time()

        record.check_out = now_time
        record.save()  # save() auto-calculates working_hours
        return record

    def to_representation(self, instance):
        return AttendanceRecordSerializer(instance).data

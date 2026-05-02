import uuid
from datetime import datetime, date
from decimal import Decimal

from django.db import models


class AttendanceStatus(models.TextChoices):
    PRESENT = "PRESENT", "Present"
    ABSENT = "ABSENT", "Absent"
    HALF_DAY = "HALF_DAY", "Half Day"
    ON_LEAVE = "ON_LEAVE", "On Leave"


class AttendanceRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    date = models.DateField(db_index=True)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT,
        db_index=True,
    )
    working_hours = models.DecimalField(
        max_digits=4, decimal_places=2, default=0.00
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-date"]
        unique_together = [("employee", "date")]

    def save(self, *args, **kwargs):
        if self.check_in and self.check_out:
            delta = (
                datetime.combine(date.min, self.check_out)
                - datetime.combine(date.min, self.check_in)
            )
            self.working_hours = Decimal(
                str(round(delta.total_seconds() / 3600, 2))
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.name} — {self.date} — {self.status}"

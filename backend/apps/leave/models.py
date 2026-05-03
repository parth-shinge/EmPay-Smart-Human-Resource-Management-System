from datetime import timedelta

from django.db import models


# ---------------------------------------------------------------------------
# LeaveType
# ---------------------------------------------------------------------------
class LeaveType(models.Model):
    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        related_name="leave_types",
    )
    name = models.CharField(max_length=50)  # Annual / Sick / Personal / Casual
    max_days_per_year = models.PositiveIntegerField()
    is_paid = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("organization", "name")]

    def __str__(self):
        return f"{self.name} ({self.max_days_per_year}d)"


# ---------------------------------------------------------------------------
# LeaveAllocation
# ---------------------------------------------------------------------------
class LeaveAllocation(models.Model):
    employee = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="leave_allocations",
    )
    leave_type = models.ForeignKey(
        "LeaveType",
        on_delete=models.CASCADE,
        related_name="allocations",
    )
    allocated_days = models.PositiveIntegerField()
    used_days = models.PositiveIntegerField(default=0)
    year = models.PositiveIntegerField()

    class Meta:
        ordering = ["-year"]
        unique_together = [("employee", "leave_type", "year")]

    @property
    def remaining_days(self):
        return self.allocated_days - self.used_days

    def __str__(self):
        return f"{self.employee.name} — {self.leave_type.name} — {self.year}"


# ---------------------------------------------------------------------------
# LeaveRequest
# ---------------------------------------------------------------------------
class LeaveStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class LeaveRequest(models.Model):
    employee = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="leave_requests",
    )
    leave_type = models.ForeignKey(
        "LeaveType",
        on_delete=models.CASCADE,
        related_name="requests",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.PositiveIntegerField(editable=False)
    reason = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=LeaveStatus.choices,
        default=LeaveStatus.PENDING,
        db_index=True,
    )
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_leaves",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-start_date"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gte=models.F("start_date")),
                name="leave_end_gte_start",
            )
        ]

    def save(self, *args, **kwargs):
        # Calculate total_days excluding weekends
        days = 0
        current = self.start_date
        while current <= self.end_date:
            if current.weekday() < 5:  # Mon-Fri
                days += 1
            current += timedelta(days=1)
        self.total_days = days
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.name} — {self.leave_type.name} — {self.status}"

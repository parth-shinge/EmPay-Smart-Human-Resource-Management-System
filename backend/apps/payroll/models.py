import uuid
from decimal import Decimal

from django.db import models


# ---------------------------------------------------------------------------
# SalaryStructure
# ---------------------------------------------------------------------------
class SalaryStructure(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="salary_structure",
    )
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transport_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pf_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("12.00"))
    professional_tax = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("200.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Salary Structures"

    def __str__(self):
        return f"{self.employee.name} — ₹{self.basic_salary}"


# ---------------------------------------------------------------------------
# Payrun
# ---------------------------------------------------------------------------
class PayrunStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PROCESSED = "PROCESSED", "Processed"
    FINALIZED = "FINALIZED", "Finalized"


class Payrun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        related_name="payruns",
    )
    month = models.PositiveIntegerField()  # 1-12
    year = models.PositiveIntegerField()
    status = models.CharField(
        max_length=10,
        choices=PayrunStatus.choices,
        default=PayrunStatus.DRAFT,
        db_index=True,
    )
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_payruns",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-year", "-month"]
        unique_together = [("organization", "month", "year")]
        constraints = [
            models.CheckConstraint(
                check=models.Q(month__gte=1, month__lte=12),
                name="payrun_valid_month",
            )
        ]

    def __str__(self):
        return f"Payrun {self.month}/{self.year} — {self.status}"


# ---------------------------------------------------------------------------
# Payslip
# ---------------------------------------------------------------------------
class PayslipStatus(models.TextChoices):
    GENERATED = "GENERATED", "Generated"
    PAID = "PAID", "Paid"


class Payslip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payrun = models.ForeignKey(
        "Payrun",
        on_delete=models.CASCADE,
        related_name="payslips",
    )
    employee = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="payslips",
    )
    working_days = models.PositiveIntegerField()
    present_days = models.PositiveIntegerField()
    leave_days = models.PositiveIntegerField(default=0)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transport_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    pf_deduction = models.DecimalField(max_digits=12, decimal_places=2)
    professional_tax = models.DecimalField(max_digits=12, decimal_places=2)
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=10,
        choices=PayslipStatus.choices,
        default=PayslipStatus.GENERATED,
    )

    class Meta:
        ordering = ["-payrun__year", "-payrun__month"]
        unique_together = [("payrun", "employee")]

    def __str__(self):
        return f"Payslip — {self.employee.name} — {self.payrun.month}/{self.payrun.year}"

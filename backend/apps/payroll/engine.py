"""
Payroll Calculation Engine
==========================

Core business logic for processing payruns and generating payslips.
Implements the pseudocode from Section 4.1 of SYSTEM_ARCHITECTURE.md.
"""

import calendar
import logging
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.attendance.models import AttendanceRecord, AttendanceStatus
from apps.leave.models import LeaveRequest, LeaveStatus

from .models import Payrun, PayrunStatus, Payslip, SalaryStructure

logger = logging.getLogger(__name__)


def get_working_days_in_month(year: int, month: int) -> int:
    """Count weekdays (Mon-Fri) in the given month."""
    first = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    last = date(year, month, last_day)

    count = 0
    current = first
    while current <= last:
        if current.weekday() < 5:  # Mon-Fri
            count += 1
        current += timedelta(days=1)
    return count


def _count_weekdays(start: date, end: date) -> int:
    """Count weekdays between start and end (inclusive)."""
    count = 0
    current = start
    while current <= end:
        if current.weekday() < 5:
            count += 1
        current += timedelta(days=1)
    return count


def _get_approved_paid_leave_days(employee, month: int, year: int) -> int:
    """Sum days of approved PAID leave overlapping the given month."""
    first = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    last = date(year, month, last_day)

    leaves = LeaveRequest.objects.filter(
        employee=employee,
        status=LeaveStatus.APPROVED,
        start_date__lte=last,
        end_date__gte=first,
        leave_type__is_paid=True,
    ).select_related("leave_type")

    total = 0
    for lr in leaves:
        eff_start = max(lr.start_date, first)
        eff_end = min(lr.end_date, last)
        total += _count_weekdays(eff_start, eff_end)
    return total


def calculate_paid_days(employee, year: int, month: int) -> Decimal:
    """
    Calculate total paid days for an employee in a given month.

    - Count PRESENT days from AttendanceRecord
    - Count HALF_DAY as 0.5
    - Add approved paid leave days
    """
    records = AttendanceRecord.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month,
    )

    present_count = records.filter(status=AttendanceStatus.PRESENT).count()
    half_day_count = records.filter(status=AttendanceStatus.HALF_DAY).count()

    present_days = Decimal(str(present_count)) + Decimal(str(half_day_count)) * Decimal("0.5")

    approved_leave_days = _get_approved_paid_leave_days(employee, month, year)

    return present_days + Decimal(str(approved_leave_days))


def generate_payslip(employee, payrun: Payrun, salary: SalaryStructure) -> Payslip:
    """
    Generate a single payslip for an employee within a payrun.

    Calculation logic (from Section 4.1):
    1. working_days = weekdays in month
    2. paid_days = present + half_day*0.5 + approved paid leave
    3. ratio = min(paid_days / working_days, 1.0)
    4. gross = (basic + hra + transport + other) * ratio
    5. pf = basic_salary * (pf_percentage / 100)  ← NOT pro-rated
    6. prof_tax = fixed amount
    7. net = gross - pf - prof_tax
    """
    working_days = get_working_days_in_month(payrun.year, payrun.month)
    paid_days = calculate_paid_days(employee, payrun.year, payrun.month)

    # Handle mid-month joining
    effective_working_days = working_days
    if employee.date_of_joining:
        doj = employee.date_of_joining
        if doj.year == payrun.year and doj.month == payrun.month:
            last_day = calendar.monthrange(payrun.year, payrun.month)[1]
            effective_working_days = _count_weekdays(
                doj, date(payrun.year, payrun.month, last_day)
            )

    if effective_working_days > 0:
        ratio = min(paid_days / Decimal(str(effective_working_days)), Decimal("1.0"))
    else:
        ratio = Decimal("0")

    # Gross salary (pro-rated)
    total_earnings = (
        salary.basic_salary
        + salary.hra
        + salary.transport_allowance
        + salary.other_allowances
    )
    gross = (total_earnings * ratio).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Deductions — PF is NOT pro-rated (always on full basic)
    pf = (salary.basic_salary * salary.pf_percentage / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    prof_tax = salary.professional_tax
    total_deductions = pf + prof_tax

    net = gross - total_deductions

    # Pro-rated individual components
    basic_prorated = (salary.basic_salary * ratio).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    hra_prorated = (salary.hra * ratio).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    transport_prorated = (salary.transport_allowance * ratio).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    other_prorated = (salary.other_allowances * ratio).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Approved leave days for this month
    leave_days = _get_approved_paid_leave_days(employee, payrun.month, payrun.year)

    payslip = Payslip.objects.create(
        payrun=payrun,
        employee=employee,
        working_days=effective_working_days,
        present_days=int(paid_days - Decimal(str(leave_days))),
        leave_days=leave_days,
        basic_salary=basic_prorated,
        hra=hra_prorated,
        transport_allowance=transport_prorated,
        other_allowances=other_prorated,
        gross_salary=gross,
        pf_deduction=pf,
        professional_tax=prof_tax,
        other_deductions=Decimal("0"),
        total_deductions=total_deductions,
        net_salary=net,
    )
    return payslip


def process_payrun(payrun: Payrun) -> dict:
    """
    Process a DRAFT payrun: generate payslips for all active employees.

    Returns summary dict:
        {total_employees, payslips_generated, total_gross, total_net, skipped}
    """
    if payrun.status != PayrunStatus.DRAFT:
        raise ValueError(f"Payrun is not in DRAFT status (current: {payrun.status}).")

    org = payrun.organization
    # First day of the payrun month and last day
    first_of_month = date(payrun.year, payrun.month, 1)
    last_day_num = calendar.monthrange(payrun.year, payrun.month)[1]
    last_of_month = date(payrun.year, payrun.month, last_day_num)

    employees = User.objects.filter(
        organization=org,
        is_active=True,
    ).exclude(role__in=[UserRole.ADMIN, UserRole.HR_OFFICER, UserRole.PAYROLL_OFFICER])

    total_employees = employees.count()
    payslips_generated = 0
    total_gross = Decimal("0")
    total_net = Decimal("0")
    skipped = 0

    for employee in employees:
        # Skip employees who joined AFTER this payrun month
        if employee.date_of_joining and employee.date_of_joining > last_of_month:
            logger.info(
                f"Skipping {employee.name} ({employee.email}) — joined "
                f"{employee.date_of_joining}, after payrun month "
                f"{payrun.month}/{payrun.year}."
            )
            skipped += 1
            continue

        try:
            salary = SalaryStructure.objects.get(employee=employee)
        except SalaryStructure.DoesNotExist:
            logger.warning(
                f"Skipping {employee.name} ({employee.email}) — no salary structure."
            )
            skipped += 1
            continue

        payslip = generate_payslip(employee, payrun, salary)
        payslips_generated += 1
        total_gross += payslip.gross_salary
        total_net += payslip.net_salary

    payrun.status = PayrunStatus.PROCESSED
    payrun.processed_at = timezone.now()
    payrun.save()

    return {
        "total_employees": total_employees,
        "payslips_generated": payslips_generated,
        "total_gross": str(total_gross.quantize(Decimal("0.01"))),
        "total_net": str(total_net.quantize(Decimal("0.01"))),
        "skipped": skipped,
    }

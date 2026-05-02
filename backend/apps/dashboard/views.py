from datetime import timedelta

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User, UserRole
from apps.accounts.permissions import IsHROrAdmin, IsPayrollOrAdmin
from apps.attendance.models import AttendanceRecord, AttendanceStatus
from apps.leave.models import LeaveAllocation, LeaveRequest, LeaveStatus
from apps.payroll.models import Payrun, PayrunStatus, Payslip


# ---------------------------------------------------------------------------
# Dashboard Stats  —  GET /api/dashboard/stats/
# ---------------------------------------------------------------------------
class DashboardStatsView(APIView):
    """
    Role-scoped dashboard statistics.

    EMPLOYEE: own attendance summary + leave balance + latest payslip
    HR_OFFICER: employee counts + today's attendance + pending leaves + departments
    PAYROLL_OFFICER: pending leaves + latest payrun + monthly payout
    ADMIN: everything combined
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        org = user.organization
        today = timezone.localdate()

        data = {}

        # ---- Employee-facing stats ----
        if user.role in ("EMPLOYEE", "ADMIN"):
            # Attendance this month
            month_records = AttendanceRecord.objects.filter(
                employee=user,
                date__month=today.month,
                date__year=today.year,
            )
            data["attendance_this_month"] = {
                "present": month_records.filter(status=AttendanceStatus.PRESENT).count(),
                "absent": month_records.filter(status=AttendanceStatus.ABSENT).count(),
                "leave": month_records.filter(status=AttendanceStatus.ON_LEAVE).count(),
                "half_day": month_records.filter(status=AttendanceStatus.HALF_DAY).count(),
            }

            # Leave balance
            allocations = LeaveAllocation.objects.filter(
                employee=user,
                year=today.year,
            ).select_related("leave_type")
            data["leave_balance"] = [
                {
                    "type": a.leave_type.name,
                    "allocated": a.allocated_days,
                    "used": a.used_days,
                    "remaining": a.remaining_days,
                }
                for a in allocations
            ]

            # Latest payslip
            latest_payslip = (
                Payslip.objects.filter(
                    employee=user,
                    payrun__status=PayrunStatus.FINALIZED,
                )
                .select_related("payrun")
                .first()
            )
            if latest_payslip:
                data["latest_payslip"] = {
                    "month": latest_payslip.payrun.month,
                    "year": latest_payslip.payrun.year,
                    "net_salary": str(latest_payslip.net_salary),
                }
            else:
                data["latest_payslip"] = None

        # ---- HR-facing stats ----
        if user.role in ("HR_OFFICER", "ADMIN"):
            data["total_employees"] = User.objects.filter(
                organization=org, is_active=True, role=UserRole.EMPLOYEE
            ).count()

            today_records = AttendanceRecord.objects.filter(
                employee__organization=org,
                employee__role=UserRole.EMPLOYEE,
                date=today,
            )
            data["present_today"] = today_records.filter(
                status=AttendanceStatus.PRESENT
            ).count()
            data["on_leave_today"] = today_records.filter(
                status=AttendanceStatus.ON_LEAVE
            ).count()

            data["pending_leave_requests"] = LeaveRequest.objects.filter(
                employee__organization=org,
                status=LeaveStatus.PENDING,
            ).count()

            departments = (
                User.objects.filter(
                    organization=org, is_active=True, role=UserRole.EMPLOYEE
                )
                .exclude(department__isnull=True)
                .exclude(department="")
                .values("department")
                .distinct()
            )
            data["total_departments"] = departments.count()
            data["department_breakdown"] = list(
                User.objects.filter(
                    organization=org, is_active=True, role=UserRole.EMPLOYEE
                )
                .exclude(department__isnull=True)
                .exclude(department="")
                .values("department")
                .annotate(count=Count("id"))
                .order_by("department")
            )

        # ---- Payroll-facing stats ----
        if user.role in ("PAYROLL_OFFICER", "ADMIN"):
            if "pending_leave_requests" not in data:
                data["pending_leave_requests"] = LeaveRequest.objects.filter(
                    employee__organization=org,
                    status=LeaveStatus.PENDING,
                ).count()

            latest_payrun = (
                Payrun.objects.filter(organization=org).first()
            )
            if latest_payrun:
                data["latest_payrun"] = {
                    "month": latest_payrun.month,
                    "year": latest_payrun.year,
                    "status": latest_payrun.status,
                }
                if latest_payrun.status in (
                    PayrunStatus.PROCESSED,
                    PayrunStatus.FINALIZED,
                ):
                    totals = Payslip.objects.filter(
                        payrun=latest_payrun
                    ).aggregate(
                        total_gross=Sum("gross_salary"),
                        total_net=Sum("net_salary"),
                    )
                    data["latest_payrun"]["total_gross"] = str(
                        totals["total_gross"] or 0
                    )
                    data["latest_payrun"]["total_net"] = str(
                        totals["total_net"] or 0
                    )
            else:
                data["latest_payrun"] = None

        return Response(data)


# ---------------------------------------------------------------------------
# Attendance Chart  —  GET /api/dashboard/attendance-chart/
# ---------------------------------------------------------------------------
class AttendanceChartView(APIView):
    """
    Last 7 working days attendance breakdown for the org.
    Returns: [{date, present, absent, on_leave, half_day}]
    HR/Admin only.
    """

    permission_classes = [IsHROrAdmin]

    def get(self, request):
        org = request.user.organization
        today = timezone.localdate()

        # Optional month/year params for full-month chart
        month = request.query_params.get("month")
        year = request.query_params.get("year")

        if month and year:
            import calendar

            m, y = int(month), int(year)
            last_day = calendar.monthrange(y, m)[1]
            dates = []
            for d in range(1, last_day + 1):
                from datetime import date as dt_date

                day = dt_date(y, m, d)
                if day.weekday() < 5:
                    dates.append(day)
        else:
            # Default: last 7 working days (skip weekends)
            dates = []
            offset = 0
            while len(dates) < 7:
                d = today - timedelta(days=offset)
                if d.weekday() < 5:  # Mon–Fri only
                    dates.append(d)
                offset += 1
            dates.reverse()

        total_employees = User.objects.filter(
            organization=org, is_active=True, role=UserRole.EMPLOYEE
        ).count()

        chart_data = []
        for d in dates:
            records = AttendanceRecord.objects.filter(
                employee__organization=org,
                employee__role=UserRole.EMPLOYEE,
                date=d,
            )
            present = records.filter(status=AttendanceStatus.PRESENT).count()
            on_leave = records.filter(status=AttendanceStatus.ON_LEAVE).count()
            half_day = records.filter(status=AttendanceStatus.HALF_DAY).count()
            explicit_absent = records.filter(status=AttendanceStatus.ABSENT).count()
            # Employees with no record at all are also absent
            absent = total_employees - present - on_leave - half_day
            # Ensure we don't double-count explicit absent records
            absent = max(absent, explicit_absent)

            chart_data.append(
                {
                    "date": d.isoformat(),
                    "present": present,
                    "absent": absent,
                    "on_leave": on_leave,
                    "half_day": half_day,
                }
            )

        return Response(chart_data)


# ---------------------------------------------------------------------------
# Payroll Summary  —  GET /api/dashboard/payroll-summary/
# ---------------------------------------------------------------------------
class PayrollSummaryView(APIView):
    """
    Summary of latest (or specified) payrun.
    Returns: total_gross, total_deductions, total_net, employee_count, average_salary.
    Payroll/Admin only.
    """

    permission_classes = [IsPayrollOrAdmin]

    def get(self, request):
        org = request.user.organization

        month = request.query_params.get("month")
        year = request.query_params.get("year")

        if month and year:
            payrun = Payrun.objects.filter(
                organization=org,
                month=int(month),
                year=int(year),
            ).first()
        else:
            payrun = Payrun.objects.filter(organization=org).first()

        if not payrun:
            return Response(
                {
                    "total_gross": "0.00",
                    "total_deductions": "0.00",
                    "total_net": "0.00",
                    "employee_count": 0,
                    "average_salary": "0.00",
                }
            )

        payslips = Payslip.objects.filter(payrun=payrun)
        totals = payslips.aggregate(
            total_gross=Sum("gross_salary"),
            total_deductions=Sum("total_deductions"),
            total_net=Sum("net_salary"),
        )

        employee_count = payslips.count()
        total_net = totals["total_net"] or 0
        average = total_net / employee_count if employee_count > 0 else 0

        return Response(
            {
                "month": payrun.month,
                "year": payrun.year,
                "status": payrun.status,
                "total_gross": str(totals["total_gross"] or 0),
                "total_deductions": str(totals["total_deductions"] or 0),
                "total_net": str(total_net),
                "employee_count": employee_count,
                "average_salary": f"{average:.2f}",
            }
        )

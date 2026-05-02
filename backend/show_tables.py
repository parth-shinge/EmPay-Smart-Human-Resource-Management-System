#!/usr/bin/env python
"""
EmPay — Live Database Viewer
Run: python show_tables.py
"""
import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db.models import Avg, Count, Sum

from apps.accounts.models import Organization, User
from apps.attendance.models import AttendanceRecord
from apps.leave.models import LeaveRequest, LeaveType
from apps.payroll.models import Payrun, Payslip, SalaryStructure


def sep(char="─", width=90):
    print(char * width)


def table(title, headers, rows, widths):
    sep("═")
    print(f"  {title}")
    sep("═")
    print("  " + " │ ".join(h.ljust(widths[i]) for i, h in enumerate(headers)))
    sep("─")
    for row in rows:
        print(
            "  "
            + " │ ".join(
                str(row[i] if row[i] is not None else "—").ljust(widths[i])[: widths[i]]
                for i in range(len(headers))
            )
        )
    sep("─")
    print(f"  {len(rows)} rows shown\n")


# Header
print("\n")
sep("═")
print("  EmPay — Live Database Overview")
sep("═")
org = Organization.objects.first()
print(f"  Organization : {org}")
print(f"  Total Users  : {User.objects.count()}")
print(f"  Employees    : {User.objects.filter(role='EMPLOYEE').count()}")
print(f"  HR Officers  : {User.objects.filter(role='HR_OFFICER').count()}")
print(f"  Payroll Off. : {User.objects.filter(role='PAYROLL_OFFICER').count()}")
print(f"  Admins       : {User.objects.filter(role='ADMIN').count()}")
sep("═")
print()

# Users table
users = User.objects.order_by("role", "name")[:20]
table(
    f"TABLE: accounts_user  ({User.objects.count()} total rows — showing 20)",
    ["Name", "Email", "Role", "Department", "Designation", "Active"],
    [
        (
            u.name,
            u.email,
            u.role,
            u.department or "—",
            u.designation or "—",
            str(u.is_active),
        )
        for u in users
    ],
    [22, 32, 16, 18, 26, 6],
)

# Attendance
attn = AttendanceRecord.objects.select_related("employee").order_by("-date")[:15]
table(
    f"TABLE: attendance_attendancerecord  ({AttendanceRecord.objects.count()} total rows — showing 15)",
    ["Employee", "Date", "Check In", "Check Out", "Hours", "Status"],
    [
        (
            a.employee.name,
            str(a.date),
            str(a.check_in or "—"),
            str(a.check_out or "—"),
            str(a.working_hours),
            a.status,
        )
        for a in attn
    ],
    [22, 12, 10, 10, 6, 10],
)

# Leave requests
leaves = LeaveRequest.objects.select_related("employee", "leave_type").order_by(
    "-start_date"
)[:10]
table(
    f"TABLE: leave_leaverequest  ({LeaveRequest.objects.count()} total rows — showing 10)",
    ["Employee", "Type", "Start", "End", "Days", "Status"],
    [
        (
            l.employee.name,
            l.leave_type.name,
            str(l.start_date),
            str(l.end_date),
            str(l.total_days),
            l.status,
        )
        for l in leaves
    ],
    [22, 14, 12, 12, 5, 10],
)

# Salary structures
salaries = SalaryStructure.objects.select_related("employee").order_by(
    "-basic_salary"
)[:10]
table(
    f"TABLE: payroll_salarystructure  ({SalaryStructure.objects.count()} total rows — showing 10)",
    ["Employee", "Department", "Basic", "HRA", "Transport", "Gross"],
    [
        (
            s.employee.name,
            s.employee.department or "—",
            f"₹{s.basic_salary:,.0f}",
            f"₹{s.hra:,.0f}",
            f"₹{s.transport_allowance:,.0f}",
            f"₹{float(s.basic_salary)+float(s.hra)+float(s.transport_allowance)+float(s.other_allowances):,.0f}",
        )
        for s in salaries
    ],
    [22, 18, 12, 12, 12, 14],
)

# Payslips
payslips = Payslip.objects.select_related("employee", "payrun").order_by(
    "-payrun__year", "-payrun__month"
)[:10]
table(
    f"TABLE: payroll_payslip  ({Payslip.objects.count()} total rows — showing 10)",
    ["Employee", "Period", "Gross", "Deductions", "Net Pay", "Status"],
    [
        (
            p.employee.name,
            f"{p.payrun.month}/{p.payrun.year}",
            f"₹{p.gross_salary:,.2f}",
            f"₹{p.total_deductions:,.2f}",
            f"₹{p.net_salary:,.2f}",
            p.status,
        )
        for p in payslips
    ],
    [22, 8, 16, 14, 16, 10],
)

# Department breakdown query
sep("═")
print("  QUERY: Department breakdown with employee count and average salary")
sep("═")
dept_stats = (
    User.objects.filter(role="EMPLOYEE")
    .values("department")
    .annotate(count=Count("id"), avg_salary=Avg("salary_structure__basic_salary"))
    .order_by("-count")
)

print(f"  {'Department':<22} │ {'Employees':>10} │ {'Avg Basic Salary':>18}")
sep("─")
for d in dept_stats:
    dept = (d["department"] or "Unknown")[:22]
    avg = f"₹{d['avg_salary']:,.0f}" if d["avg_salary"] else "—"
    print(f"  {dept:<22} │ {d['count']:>10} │ {avg:>18}")
sep("─")
print(
    f"  Total: {User.objects.filter(role='EMPLOYEE').count()} employees across {dept_stats.count()} departments"
)

# Payroll summary
sep("═")
print("  QUERY: Payroll summary for latest finalized payrun")
sep("═")
latest = Payrun.objects.filter(status="FINALIZED").order_by("-year", "-month").first()
if latest:
    ps = Payslip.objects.filter(payrun=latest).aggregate(
        gross=Sum("gross_salary"),
        deductions=Sum("total_deductions"),
        net=Sum("net_salary"),
    )
    print(f"  Payrun        : {latest.month}/{latest.year} — {latest.status}")
    print(f"  Employees paid: {Payslip.objects.filter(payrun=latest).count()}")
    print(f"  Total Gross   : ₹{ps['gross']:,.2f}")
    print(f"  Total Deducted: ₹{ps['deductions']:,.2f}")
    print(f"  Total Net     : ₹{ps['net']:,.2f}")
else:
    print("  No finalized payrun found.")
sep("═")
print()

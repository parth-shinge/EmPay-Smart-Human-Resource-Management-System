"""
Seed demo data for EmPay.

Seeds ALL data from Section 10 of SYSTEM_ARCHITECTURE.md:
- Organization (TechNova Solutions)
- 6 Users with exact credentials
- 4 Leave Types
- Leave Allocations for all 3 employees (2026)
- 3 Salary Structures
- Attendance Records for April 2026 (22 working days)
- 3 Leave Requests (2 approved, 1 pending)
- 1 Payrun (April 2026, FINALIZED) with 3 Payslips

Fully idempotent — uses get_or_create() everywhere.
Usage: python manage.py seed_demo_data
"""

import random
from datetime import date, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import Organization, User, UserRole
from apps.attendance.models import AttendanceRecord, AttendanceStatus
from apps.leave.models import LeaveAllocation, LeaveRequest, LeaveStatus, LeaveType
from apps.payroll.models import (
    Payrun,
    PayrunStatus,
    Payslip,
    PayslipStatus,
    SalaryStructure,
)


class Command(BaseCommand):
    help = "Seed complete demo data for EmPay (all sections from SYSTEM_ARCHITECTURE.md)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n" + "=" * 60))
        self.stdout.write(self.style.MIGRATE_HEADING("  EmPay — Seeding Demo Data"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 60 + "\n"))

        org = self._seed_organization()
        users = self._seed_users(org)
        leave_types = self._seed_leave_types(org)
        self._seed_leave_allocations(users, leave_types)
        self._seed_salary_structures(users)
        leave_requests = self._seed_leave_requests(users, leave_types)
        self._seed_attendance_records(users, leave_requests)
        self._seed_payrun_and_payslips(org, users)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  ✅ All demo data seeded successfully!"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("  Login credentials:"))
        self.stdout.write(f"    Admin:   admin@technova.com   / Admin@123")
        self.stdout.write(f"    HR:      hr@technova.com      / Officer@123")
        self.stdout.write(f"    Payroll: payroll@technova.com  / Officer@123")
        self.stdout.write(f"    Sneha:   sneha@technova.com   / Emp@12345")
        self.stdout.write(f"    Vikram:  vikram@technova.com  / Emp@12345")
        self.stdout.write(f"    Anjali:  anjali@technova.com  / Emp@12345")
        self.stdout.write("")

    # ------------------------------------------------------------------
    # 1. Organization (Section 10.1)
    # ------------------------------------------------------------------
    def _seed_organization(self):
        self.stdout.write(self.style.HTTP_INFO("▸ Seeding Organization..."))
        org, created = Organization.objects.get_or_create(
            name="TechNova Solutions Pvt. Ltd.",
            defaults={
                "address": "4th Floor, Pinnacle Tower, Baner Road, Pune, Maharashtra 411045",
            },
        )
        self._log("Organization", org.name, created)
        return org

    # ------------------------------------------------------------------
    # 2. Users (Section 10.2)
    # ------------------------------------------------------------------
    def _seed_users(self, org):
        self.stdout.write(self.style.HTTP_INFO("▸ Seeding Users..."))

        users_data = [
            {
                "email": "admin@technova.com",
                "name": "Rajesh Kumar",
                "password": "Admin@123",
                "role": UserRole.ADMIN,
                "department": "Management",
                "designation": "CEO",
                "date_of_joining": date(2024, 1, 15),
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "email": "hr@technova.com",
                "name": "Priya Sharma",
                "password": "Officer@123",
                "role": UserRole.HR_OFFICER,
                "department": "Human Resources",
                "designation": "HR Manager",
                "date_of_joining": date(2024, 3, 1),
            },
            {
                "email": "payroll@technova.com",
                "name": "Amit Patel",
                "password": "Officer@123",
                "role": UserRole.PAYROLL_OFFICER,
                "department": "Finance",
                "designation": "Payroll Manager",
                "date_of_joining": date(2024, 3, 15),
            },
            {
                "email": "sneha@technova.com",
                "name": "Sneha Reddy",
                "password": "Emp@12345",
                "role": UserRole.EMPLOYEE,
                "department": "Engineering",
                "designation": "Senior Developer",
                "date_of_joining": date(2024, 6, 1),
            },
            {
                "email": "vikram@technova.com",
                "name": "Vikram Singh",
                "password": "Emp@12345",
                "role": UserRole.EMPLOYEE,
                "department": "Engineering",
                "designation": "Junior Developer",
                "date_of_joining": date(2025, 1, 10),
            },
            {
                "email": "anjali@technova.com",
                "name": "Anjali Mehta",
                "password": "Emp@12345",
                "role": UserRole.EMPLOYEE,
                "department": "Marketing",
                "designation": "Marketing Executive",
                "date_of_joining": date(2025, 4, 1),
            },
        ]

        users = {}
        for ud in users_data:
            password = ud.pop("password")
            user, created = User.objects.get_or_create(
                email=ud["email"],
                defaults={**ud, "organization": org},
            )
            if created:
                user.set_password(password)
                user.save()
            users[user.email] = user
            self._log("User", f"{user.name} ({user.email})", created)

        return users

    # ------------------------------------------------------------------
    # 3. Leave Types (Section 10.3)
    # ------------------------------------------------------------------
    def _seed_leave_types(self, org):
        self.stdout.write(self.style.HTTP_INFO("▸ Seeding Leave Types..."))

        types_data = [
            {"name": "Annual Leave", "max_days_per_year": 20, "is_paid": True},
            {"name": "Sick Leave", "max_days_per_year": 10, "is_paid": True},
            {"name": "Personal Leave", "max_days_per_year": 5, "is_paid": True},
            {"name": "Casual Leave", "max_days_per_year": 7, "is_paid": True},
        ]

        leave_types = {}
        for lt in types_data:
            obj, created = LeaveType.objects.get_or_create(
                organization=org,
                name=lt["name"],
                defaults={
                    "max_days_per_year": lt["max_days_per_year"],
                    "is_paid": lt["is_paid"],
                },
            )
            leave_types[obj.name] = obj
            self._log("LeaveType", obj.name, created)

        return leave_types

    # ------------------------------------------------------------------
    # 4. Leave Allocations (Section 10.4 — all 3 employees, 2026)
    # ------------------------------------------------------------------
    def _seed_leave_allocations(self, users, leave_types):
        self.stdout.write(self.style.HTTP_INFO("▸ Seeding Leave Allocations..."))

        employees = [
            users["sneha@technova.com"],
            users["vikram@technova.com"],
            users["anjali@technova.com"],
        ]

        for emp in employees:
            for lt_name, lt_obj in leave_types.items():
                alloc, created = LeaveAllocation.objects.get_or_create(
                    employee=emp,
                    leave_type=lt_obj,
                    year=2026,
                    defaults={"allocated_days": lt_obj.max_days_per_year},
                )
                self._log(
                    "LeaveAllocation",
                    f"{emp.name} — {lt_name} (2026)",
                    created,
                )

    # ------------------------------------------------------------------
    # 5. Salary Structures (Section 10.5)
    # ------------------------------------------------------------------
    def _seed_salary_structures(self, users):
        self.stdout.write(self.style.HTTP_INFO("▸ Seeding Salary Structures..."))

        salary_data = [
            {
                "email": "sneha@technova.com",
                "basic_salary": Decimal("60000"),
                "hra": Decimal("24000"),
                "transport_allowance": Decimal("5000"),
                "other_allowances": Decimal("3000"),
                "pf_percentage": Decimal("12.00"),
                "professional_tax": Decimal("200.00"),
            },
            {
                "email": "vikram@technova.com",
                "basic_salary": Decimal("40000"),
                "hra": Decimal("16000"),
                "transport_allowance": Decimal("3500"),
                "other_allowances": Decimal("2000"),
                "pf_percentage": Decimal("12.00"),
                "professional_tax": Decimal("200.00"),
            },
            {
                "email": "anjali@technova.com",
                "basic_salary": Decimal("45000"),
                "hra": Decimal("18000"),
                "transport_allowance": Decimal("4000"),
                "other_allowances": Decimal("2500"),
                "pf_percentage": Decimal("12.00"),
                "professional_tax": Decimal("200.00"),
            },
        ]

        for sd in salary_data:
            emp = users[sd["email"]]
            sal, created = SalaryStructure.objects.get_or_create(
                employee=emp,
                defaults={
                    "basic_salary": sd["basic_salary"],
                    "hra": sd["hra"],
                    "transport_allowance": sd["transport_allowance"],
                    "other_allowances": sd["other_allowances"],
                    "pf_percentage": sd["pf_percentage"],
                    "professional_tax": sd["professional_tax"],
                },
            )
            self._log("SalaryStructure", f"{emp.name} — ₹{sd['basic_salary']}", created)

    # ------------------------------------------------------------------
    # 6. Leave Requests (Section 10.7)
    # ------------------------------------------------------------------
    def _seed_leave_requests(self, users, leave_types):
        self.stdout.write(self.style.HTTP_INFO("▸ Seeding Leave Requests..."))

        reviewer = users["payroll@technova.com"]

        requests_data = [
            {
                "employee": users["sneha@technova.com"],
                "leave_type": leave_types["Annual Leave"],
                "start_date": date(2026, 4, 13),
                "end_date": date(2026, 4, 14),
                "reason": "Family function",
                "status": LeaveStatus.APPROVED,
                "reviewed_by": reviewer,
            },
            {
                "employee": users["anjali@technova.com"],
                "leave_type": leave_types["Sick Leave"],
                "start_date": date(2026, 4, 20),
                "end_date": date(2026, 4, 20),
                "reason": "Not feeling well",
                "status": LeaveStatus.APPROVED,
                "reviewed_by": reviewer,
            },
            {
                "employee": users["vikram@technova.com"],
                "leave_type": leave_types["Personal Leave"],
                "start_date": date(2026, 5, 8),
                "end_date": date(2026, 5, 9),
                "reason": "Personal errands",
                "status": LeaveStatus.PENDING,
                "reviewed_by": None,
            },
        ]

        leave_requests = []
        for lr_data in requests_data:
            lr, created = LeaveRequest.objects.get_or_create(
                employee=lr_data["employee"],
                leave_type=lr_data["leave_type"],
                start_date=lr_data["start_date"],
                end_date=lr_data["end_date"],
                defaults={
                    "reason": lr_data["reason"],
                    "status": lr_data["status"],
                    "reviewed_by": lr_data["reviewed_by"],
                    "reviewed_at": timezone.now() if lr_data["reviewed_by"] else None,
                },
            )
            leave_requests.append(lr)
            self._log(
                "LeaveRequest",
                f"{lr_data['employee'].name} — {lr_data['leave_type'].name} — {lr_data['status']}",
                created,
            )

        # Update leave allocations for APPROVED requests
        for lr in leave_requests:
            if lr.status == LeaveStatus.APPROVED:
                try:
                    alloc = LeaveAllocation.objects.get(
                        employee=lr.employee,
                        leave_type=lr.leave_type,
                        year=lr.start_date.year,
                    )
                    if alloc.used_days == 0:
                        alloc.used_days = lr.total_days
                        alloc.save()
                except LeaveAllocation.DoesNotExist:
                    pass

        return leave_requests

    # ------------------------------------------------------------------
    # 7. Attendance Records (Section 10.6 — April 2026)
    # ------------------------------------------------------------------
    def _seed_attendance_records(self, users, leave_requests):
        self.stdout.write(self.style.HTTP_INFO("▸ Seeding Attendance Records (April 2026)..."))

        # Collect approved ON_LEAVE dates per employee
        leave_dates = {}
        for lr in leave_requests:
            if lr.status == LeaveStatus.APPROVED and lr.start_date.month == 4 and lr.start_date.year == 2026:
                emp_email = lr.employee.email
                if emp_email not in leave_dates:
                    leave_dates[emp_email] = set()
                current = lr.start_date
                while current <= lr.end_date:
                    if current.weekday() < 5:
                        leave_dates[emp_email].add(current)
                    current += timedelta(days=1)

        # April 2026 weekdays
        april_weekdays = []
        current = date(2026, 4, 1)
        while current <= date(2026, 4, 30):
            if current.weekday() < 5:
                april_weekdays.append(current)
            current += timedelta(days=1)
        # Total: 22 working days

        # Section 10.6 distributions:
        # Sneha:  present=18, half_day=0, on_leave=2, absent=2
        # Vikram: present=20, half_day=1, on_leave=0, absent=1
        # Anjali: present=19, half_day=0, on_leave=1, absent=2

        distributions = {
            "sneha@technova.com": {"present": 18, "half_day": 0, "on_leave": 2, "absent": 2},
            "vikram@technova.com": {"present": 20, "half_day": 1, "on_leave": 0, "absent": 1},
            "anjali@technova.com": {"present": 19, "half_day": 0, "on_leave": 1, "absent": 2},
        }

        random.seed(42)  # Deterministic for reproducibility

        for email, dist in distributions.items():
            emp = users[email]
            emp_leave_dates = leave_dates.get(email, set())

            # Separate leave days from the rest
            remaining_days = [d for d in april_weekdays if d not in emp_leave_dates]

            # Assign absent days (pick from the end of remaining)
            random.shuffle(remaining_days)
            absent_days = set(remaining_days[: dist["absent"]])
            remaining_after_absent = [d for d in remaining_days if d not in absent_days]

            # Assign half_day
            half_day_days = set(remaining_after_absent[: dist["half_day"]])
            present_days = set(
                d for d in remaining_after_absent if d not in half_day_days
            )

            records_created = 0
            for d in april_weekdays:
                if d in emp_leave_dates:
                    att_status = AttendanceStatus.ON_LEAVE
                    cin, cout = None, None
                    notes = "Leave"
                elif d in absent_days:
                    att_status = AttendanceStatus.ABSENT
                    cin, cout = None, None
                    notes = ""
                elif d in half_day_days:
                    att_status = AttendanceStatus.HALF_DAY
                    cin = time(
                        random.randint(8, 9),
                        random.randint(0, 59),
                    )
                    cout = time(13, random.randint(0, 30))
                    notes = "Half day"
                else:
                    att_status = AttendanceStatus.PRESENT
                    cin = time(
                        random.randint(8, 9),
                        random.randint(0, 59),
                    )
                    cout = time(
                        random.randint(17, 18),
                        random.randint(0, 59),
                    )
                    notes = ""

                _, created = AttendanceRecord.objects.get_or_create(
                    employee=emp,
                    date=d,
                    defaults={
                        "check_in": cin,
                        "check_out": cout,
                        "status": att_status,
                        "notes": notes,
                    },
                )
                if created:
                    records_created += 1

            self.stdout.write(
                f"    {emp.name}: {records_created} records created "
                f"(P={dist['present']}, HD={dist['half_day']}, "
                f"OL={dist['on_leave']}, A={dist['absent']})"
            )

    # ------------------------------------------------------------------
    # 8. Payrun & Payslips (Section 10.8 — April 2026)
    # ------------------------------------------------------------------
    def _seed_payrun_and_payslips(self, org, users):
        self.stdout.write(self.style.HTTP_INFO("▸ Seeding Payrun & Payslips (April 2026)..."))

        payroll_officer = users["payroll@technova.com"]

        payrun, created = Payrun.objects.get_or_create(
            organization=org,
            month=4,
            year=2026,
            defaults={
                "status": PayrunStatus.FINALIZED,
                "created_by": payroll_officer,
                "processed_at": timezone.now(),
            },
        )
        self._log("Payrun", "April 2026 — FINALIZED", created)

        # Exact payslip calculations from Section 10.8
        # April 2026 has 22 working days
        payslips_data = [
            {
                "employee": users["sneha@technova.com"],
                "working_days": 22,
                "present_days": 18,
                "leave_days": 2,
                # ratio = 20/22 = 0.9091
                "basic_salary": Decimal("54545.45"),
                "hra": Decimal("21818.18"),
                "transport_allowance": Decimal("4545.45"),
                "other_allowances": Decimal("2727.27"),
                "gross_salary": Decimal("83636.36"),
                "pf_deduction": Decimal("7200.00"),
                "professional_tax": Decimal("200.00"),
                "other_deductions": Decimal("0"),
                "total_deductions": Decimal("7400.00"),
                "net_salary": Decimal("76236.36"),
            },
            {
                "employee": users["vikram@technova.com"],
                "working_days": 22,
                "present_days": 20,  # 20 full + 1 half = 20.5 adj
                "leave_days": 0,
                # ratio = 20.5/22 = 0.9318
                "basic_salary": Decimal("37272.73"),
                "hra": Decimal("14909.09"),
                "transport_allowance": Decimal("3261.36"),
                "other_allowances": Decimal("1862.50"),
                "gross_salary": Decimal("57305.68"),
                "pf_deduction": Decimal("4800.00"),
                "professional_tax": Decimal("200.00"),
                "other_deductions": Decimal("0"),
                "total_deductions": Decimal("5000.00"),
                "net_salary": Decimal("52305.68"),
            },
            {
                "employee": users["anjali@technova.com"],
                "working_days": 22,
                "present_days": 19,
                "leave_days": 1,
                # ratio = 20/22 = 0.9091
                "basic_salary": Decimal("40909.09"),
                "hra": Decimal("16363.64"),
                "transport_allowance": Decimal("3636.36"),
                "other_allowances": Decimal("2272.73"),
                "gross_salary": Decimal("63181.82"),
                "pf_deduction": Decimal("5400.00"),
                "professional_tax": Decimal("200.00"),
                "other_deductions": Decimal("0"),
                "total_deductions": Decimal("5600.00"),
                "net_salary": Decimal("57581.82"),
            },
        ]

        for ps_data in payslips_data:
            emp = ps_data.pop("employee")
            payslip, created = Payslip.objects.get_or_create(
                payrun=payrun,
                employee=emp,
                defaults={
                    **ps_data,
                    "status": PayslipStatus.GENERATED,
                },
            )
            self._log(
                "Payslip",
                f"{emp.name} — Net ₹{ps_data['net_salary']}",
                created,
            )

    # ------------------------------------------------------------------
    # Utility
    # ------------------------------------------------------------------
    def _log(self, model, name, created):
        tag = self.style.SUCCESS("Created") if created else self.style.WARNING("Exists ")
        self.stdout.write(f"    [{tag}] {model}: {name}")

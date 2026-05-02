"""
Seed attendance records for all active employees for the last N days.
Ensures every active EMPLOYEE has a record for each working day.
"""
import random
from datetime import time, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.attendance.models import AttendanceRecord, AttendanceStatus


class Command(BaseCommand):
    help = "Seed attendance records for all active employees"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days", type=int, default=7, help="Number of past days to seed (default: 7)"
        )

    def handle(self, *args, **options):
        days = options["days"]
        today = timezone.localdate()
        employees = list(User.objects.filter(role=UserRole.EMPLOYEE, is_active=True))
        emp_count = len(employees)

        self.stdout.write(f"Seeding attendance for {emp_count} employees over {days} days...")

        created = 0
        skipped = 0
        bulk_records = []

        for day_offset in range(days):
            date = today - timedelta(days=day_offset)
            # Skip weekends
            if date.weekday() >= 5:
                continue

            # Pre-fetch existing records for this date to avoid per-employee queries
            existing = set(
                AttendanceRecord.objects.filter(
                    date=date, employee__in=employees
                ).values_list("employee_id", flat=True)
            )

            for emp in employees:
                if emp.id in existing:
                    skipped += 1
                    continue

                # Weighted random: ~80% present, ~8% on_leave, ~7% absent, ~5% half_day
                roll = random.random()
                if roll < 0.80:
                    status = AttendanceStatus.PRESENT
                    h_in = random.randint(8, 10)
                    m_in = random.randint(0, 59)
                    dur_h = random.randint(7, 9)
                    dur_m = random.randint(0, 59)
                    check_in = time(h_in, m_in, 0)
                    total_min = h_in * 60 + m_in + dur_h * 60 + dur_m
                    out_h = min(total_min // 60, 23)
                    out_m = total_min % 60
                    check_out = time(out_h, out_m, 0)
                    hours = round(dur_h + dur_m / 60, 2)
                elif roll < 0.88:
                    status = AttendanceStatus.ON_LEAVE
                    check_in = None
                    check_out = None
                    hours = 0
                elif roll < 0.95:
                    status = AttendanceStatus.ABSENT
                    check_in = None
                    check_out = None
                    hours = 0
                else:
                    status = AttendanceStatus.HALF_DAY
                    h_in = random.randint(8, 10)
                    m_in = random.randint(0, 59)
                    dur_h = random.randint(3, 4)
                    dur_m = random.randint(0, 59)
                    check_in = time(h_in, m_in, 0)
                    total_min = h_in * 60 + m_in + dur_h * 60 + dur_m
                    out_h = min(total_min // 60, 23)
                    out_m = total_min % 60
                    check_out = time(out_h, out_m, 0)
                    hours = round(dur_h + dur_m / 60, 2)

                bulk_records.append(
                    AttendanceRecord(
                        employee=emp,
                        date=date,
                        check_in=check_in,
                        check_out=check_out,
                        working_hours=hours,
                        status=status,
                    )
                )
                created += 1

        # Bulk create for speed (bypass model save to avoid re-calc)
        AttendanceRecord.objects.bulk_create(bulk_records, batch_size=500)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done! Created {created} records, skipped {skipped} existing."
            )
        )

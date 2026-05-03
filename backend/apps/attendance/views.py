from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployee, IsHROrAdmin, IsHROrPayrollOrAdmin
from .models import AttendanceRecord, AttendanceStatus
from .serializers import (
    AttendanceRecordSerializer,
    CheckInSerializer,
    CheckOutSerializer,
)


# ---------------------------------------------------------------------------
# Check-In View  —  POST /api/attendance/checkin/
# ---------------------------------------------------------------------------
class CheckInView(APIView):
    """Employee checks in for the day."""

    permission_classes = [IsEmployee]

    def post(self, request):
        serializer = CheckInSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        return Response(
            serializer.to_representation(record),
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Check-Out View  —  POST /api/attendance/checkout/
# ---------------------------------------------------------------------------
class CheckOutView(APIView):
    """Employee checks out for the day."""

    permission_classes = [IsEmployee]

    def post(self, request):
        serializer = CheckOutSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        record = serializer.update_record(serializer.validated_data)
        return Response(
            serializer.to_representation(record),
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# My Attendance  —  GET /api/attendance/my/
# ---------------------------------------------------------------------------
class MyAttendanceView(generics.ListAPIView):
    """Employee views own attendance. Filter by ?month=&year=."""

    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AttendanceRecord.objects.filter(employee=self.request.user)

        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")

        if month:
            qs = qs.filter(date__month=int(month))
        if year:
            qs = qs.filter(date__year=int(year))

        return qs


# ---------------------------------------------------------------------------
# All Attendance  —  GET /api/attendance/all/
# ---------------------------------------------------------------------------
class AllAttendanceView(generics.ListAPIView):
    """HR/Payroll/Admin view all attendance. Filter by date, department, employee, month, year, status."""

    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsHROrPayrollOrAdmin]

    def get_queryset(self):
        qs = AttendanceRecord.objects.filter(
            employee__organization=self.request.user.organization
        ).select_related("employee")

        # Filter by specific date
        date_param = self.request.query_params.get("date")
        if date_param:
            qs = qs.filter(date=date_param)

        # Filter by month/year
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        if month:
            qs = qs.filter(date__month=int(month))
        if year:
            qs = qs.filter(date__year=int(year))

        # Filter by department
        department = self.request.query_params.get("department")
        if department:
            qs = qs.filter(employee__department__iexact=department)

        # Filter by employee ID
        employee = self.request.query_params.get("employee")
        if employee:
            qs = qs.filter(employee_id=employee)

        # Filter by status
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        return qs


# ---------------------------------------------------------------------------
# Employee Attendance  —  GET /api/attendance/employee/<uuid>/
# ---------------------------------------------------------------------------
class EmployeeAttendanceView(generics.ListAPIView):
    """HR/Admin view a specific employee's attendance. Filter by ?month=&year=."""

    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsHROrAdmin]

    def get_queryset(self):
        employee_id = self.kwargs["pk"]
        qs = AttendanceRecord.objects.filter(
            employee_id=employee_id,
            employee__organization=self.request.user.organization,
        )

        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        if month:
            qs = qs.filter(date__month=int(month))
        if year:
            qs = qs.filter(date__year=int(year))

        return qs


# ---------------------------------------------------------------------------
# Attendance Summary  —  GET /api/attendance/summary/
# ---------------------------------------------------------------------------
class AttendanceSummaryView(APIView):
    """
    Returns present_count, absent_count, leave_count, half_day_count
    for the current month. Scoped by role:
      - EMPLOYEE: own records
      - HR/Admin/Payroll: all org records (or per ?employee= param)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        month = int(request.query_params.get("month", today.month))
        year = int(request.query_params.get("year", today.year))

        user = request.user
        if user.role in ("ADMIN", "HR_OFFICER", "PAYROLL_OFFICER"):
            qs = AttendanceRecord.objects.filter(
                employee__organization=user.organization,
                date__month=month,
                date__year=year,
            )
            # Optionally scope to a single employee
            employee_id = request.query_params.get("employee")
            if employee_id:
                qs = qs.filter(employee_id=employee_id)
        else:
            qs = AttendanceRecord.objects.filter(
                employee=user,
                date__month=month,
                date__year=year,
            )

        summary = qs.aggregate(
            present_count=Count("id", filter=Q(status=AttendanceStatus.PRESENT)),
            absent_count=Count("id", filter=Q(status=AttendanceStatus.ABSENT)),
            leave_count=Count("id", filter=Q(status=AttendanceStatus.ON_LEAVE)),
            half_day_count=Count("id", filter=Q(status=AttendanceStatus.HALF_DAY)),
        )

        return Response(summary)

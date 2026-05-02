from datetime import timedelta

from django.db.models import F
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsHROrAdmin, IsHROrPayrollOrAdmin, IsPayrollOrAdmin
from apps.attendance.models import AttendanceRecord, AttendanceStatus

from .models import (
    LeaveAllocation,
    LeaveRequest,
    LeaveStatus,
    LeaveType,
)
from .serializers import (
    LeaveAllocationSerializer,
    LeaveDecisionSerializer,
    LeaveRequestCreateSerializer,
    LeaveRequestSerializer,
    LeaveTypeSerializer,
)


# ---------------------------------------------------------------------------
# LeaveType List  —  GET /api/leave/types/
# ---------------------------------------------------------------------------
class LeaveTypeListView(generics.ListAPIView):
    """All authenticated users can view leave types for their org."""

    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LeaveType.objects.filter(
            organization=self.request.user.organization
        )


# ---------------------------------------------------------------------------
# LeaveAllocation List/Create  —  GET/POST /api/leave/allocations/
# ---------------------------------------------------------------------------
class LeaveAllocationListCreateView(generics.ListCreateAPIView):
    """HR/Admin manage leave allocations."""

    serializer_class = LeaveAllocationSerializer
    permission_classes = [IsHROrAdmin]

    def get_queryset(self):
        qs = LeaveAllocation.objects.filter(
            employee__organization=self.request.user.organization
        )
        employee = self.request.query_params.get("employee")
        if employee:
            qs = qs.filter(employee_id=employee)
        year = self.request.query_params.get("year")
        if year:
            qs = qs.filter(year=int(year))
        return qs

    def perform_create(self, serializer):
        serializer.save()


# ---------------------------------------------------------------------------
# Leave Balance  —  GET /api/leave/balance/
# ---------------------------------------------------------------------------
class LeaveBalanceView(APIView):
    """Employee views own leave balance summary."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = int(
            request.query_params.get("year", timezone.localdate().year)
        )
        allocations = LeaveAllocation.objects.filter(
            employee=request.user,
            year=year,
        ).select_related("leave_type")

        data = []
        for alloc in allocations:
            data.append(
                {
                    "leave_type": alloc.leave_type.name,
                    "allocated": alloc.allocated_days,
                    "used": alloc.used_days,
                    "remaining": alloc.remaining_days,
                }
            )

        return Response(data)


# ---------------------------------------------------------------------------
# LeaveRequest List/Create  —  GET/POST /api/leave/requests/
# ---------------------------------------------------------------------------
class LeaveRequestListCreateView(generics.ListCreateAPIView):
    """
    Employee: GET own requests, POST new request.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer

    def get_queryset(self):
        return LeaveRequest.objects.filter(
            employee=self.request.user
        ).select_related("employee", "leave_type", "reviewed_by")


# ---------------------------------------------------------------------------
# LeaveRequest All View  —  GET /api/leave/requests/all/
# ---------------------------------------------------------------------------
class LeaveRequestAllView(generics.ListAPIView):
    """HR/Payroll/Admin view all leave requests. Filter by ?status= and ?employee=."""

    serializer_class = LeaveRequestSerializer
    permission_classes = [IsHROrPayrollOrAdmin]

    def get_queryset(self):
        qs = LeaveRequest.objects.filter(
            employee__organization=self.request.user.organization
        ).select_related("employee", "leave_type", "reviewed_by")

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        employee = self.request.query_params.get("employee")
        if employee:
            qs = qs.filter(employee_id=employee)

        return qs


# ---------------------------------------------------------------------------
# Leave Decision  —  PATCH /api/leave/requests/<uuid>/decide/
# ---------------------------------------------------------------------------
class LeaveRequestDecideView(APIView):
    """
    Payroll Officer / Admin approve or reject a leave request.
    On APPROVED:
      - Increment LeaveAllocation.used_days
      - Create AttendanceRecord entries with status=ON_LEAVE for each weekday
    """

    permission_classes = [IsPayrollOrAdmin]

    def patch(self, request, pk):
        try:
            leave_request = LeaveRequest.objects.select_related(
                "employee", "leave_type"
            ).get(
                pk=pk,
                employee__organization=request.user.organization,
            )
        except LeaveRequest.DoesNotExist:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if leave_request.status != LeaveStatus.PENDING:
            return Response(
                {"detail": "This leave request has already been decided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LeaveDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        decision = serializer.validated_data["status"]
        leave_request.status = decision
        leave_request.reviewed_by = request.user
        leave_request.reviewed_at = timezone.now()

        if decision == LeaveStatus.APPROVED:
            # Increment used_days on allocation
            year = leave_request.start_date.year
            try:
                allocation = LeaveAllocation.objects.get(
                    employee=leave_request.employee,
                    leave_type=leave_request.leave_type,
                    year=year,
                )
                allocation.used_days = F("used_days") + leave_request.total_days
                allocation.save()
                allocation.refresh_from_db()
            except LeaveAllocation.DoesNotExist:
                pass  # Allocation may not exist; proceed anyway

            # Create AttendanceRecord entries for each weekday in the range
            current = leave_request.start_date
            while current <= leave_request.end_date:
                if current.weekday() < 5:  # Mon-Fri
                    AttendanceRecord.objects.get_or_create(
                        employee=leave_request.employee,
                        date=current,
                        defaults={
                            "status": AttendanceStatus.ON_LEAVE,
                            "notes": f"Leave: {leave_request.leave_type.name}",
                        },
                    )
                current += timedelta(days=1)

        elif decision == LeaveStatus.REJECTED:
            leave_request.rejection_reason = serializer.validated_data.get(
                "rejection_reason", ""
            )

        leave_request.save()

        return Response(
            LeaveRequestSerializer(leave_request).data,
            status=status.HTTP_200_OK,
        )

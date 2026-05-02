from django.db.models import Count, Sum
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsPayrollOrAdmin
from .engine import process_payrun
from .models import Payrun, PayrunStatus, Payslip, SalaryStructure
from .serializers import (
    PayrunCreateSerializer,
    PayrunSerializer,
    PayslipSerializer,
    PayslipSummarySerializer,
    SalaryStructureSerializer,
)


# ---------------------------------------------------------------------------
# Salary Structure  —  GET/POST /api/salary/structure/
# ---------------------------------------------------------------------------
class SalaryStructureListView(generics.ListCreateAPIView):
    """Payroll/Admin manage salary structures."""

    serializer_class = SalaryStructureSerializer
    permission_classes = [IsPayrollOrAdmin]

    def get_queryset(self):
        return SalaryStructure.objects.filter(
            employee__organization=self.request.user.organization
        ).select_related("employee")


# ---------------------------------------------------------------------------
# Salary Structure Detail  —  GET/PATCH/DELETE /api/salary/structure/<uuid>/
# ---------------------------------------------------------------------------
class SalaryStructureDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Payroll/Admin manage individual salary structure."""

    serializer_class = SalaryStructureSerializer
    permission_classes = [IsPayrollOrAdmin]
    lookup_field = "pk"

    def get_queryset(self):
        return SalaryStructure.objects.filter(
            employee__organization=self.request.user.organization
        ).select_related("employee")


# ---------------------------------------------------------------------------
# Payrun List / Create  —  GET/POST /api/payroll/payruns/
# ---------------------------------------------------------------------------
class PayrunListCreateView(generics.ListCreateAPIView):
    """Payroll/Admin list existing payruns or create new DRAFT payrun."""

    permission_classes = [IsPayrollOrAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PayrunCreateSerializer
        return PayrunSerializer

    def get_queryset(self):
        return (
            Payrun.objects.filter(organization=self.request.user.organization)
            .annotate(payslip_count=Count("payslips"))
            .select_related("created_by")
        )


# ---------------------------------------------------------------------------
# Payrun Process  —  POST /api/payroll/payruns/<uuid>/process/
# ---------------------------------------------------------------------------
class PayrunProcessView(APIView):
    """Process a DRAFT payrun — generate payslips for all employees."""

    permission_classes = [IsPayrollOrAdmin]

    def post(self, request, pk):
        try:
            payrun = Payrun.objects.get(
                pk=pk,
                organization=request.user.organization,
            )
        except Payrun.DoesNotExist:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payrun.status != PayrunStatus.DRAFT:
            return Response(
                {"detail": "Payrun is not in DRAFT status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            summary = process_payrun(payrun)
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "id": str(payrun.id),
                "status": payrun.status,
                "processed_at": payrun.processed_at,
                **summary,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Payrun Finalize  —  POST /api/payroll/payruns/<uuid>/finalize/
# ---------------------------------------------------------------------------
class PayrunFinalizeView(APIView):
    """Finalize a PROCESSED payrun — makes payslips visible to employees."""

    permission_classes = [IsPayrollOrAdmin]

    def post(self, request, pk):
        try:
            payrun = Payrun.objects.get(
                pk=pk,
                organization=request.user.organization,
            )
        except Payrun.DoesNotExist:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payrun.status != PayrunStatus.PROCESSED:
            return Response(
                {"detail": "Payrun must be PROCESSED before finalizing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payrun.status = PayrunStatus.FINALIZED
        payrun.save()

        return Response(
            {"id": str(payrun.id), "status": payrun.status},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Payslip List  —  GET /api/payroll/payslips/
# ---------------------------------------------------------------------------
class PayslipListView(generics.ListAPIView):
    """
    Employee: own payslips (only from FINALIZED payruns).
    Payroll/Admin: all payslips in org. Filter by ?month=&year=.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return PayslipSummarySerializer

    def get_queryset(self):
        user = self.request.user

        if user.role in ("ADMIN", "PAYROLL_OFFICER"):
            qs = Payslip.objects.filter(
                payrun__organization=user.organization
            )
        else:
            qs = Payslip.objects.filter(
                employee=user,
                payrun__status=PayrunStatus.FINALIZED,
            )

        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        if month:
            qs = qs.filter(payrun__month=int(month))
        if year:
            qs = qs.filter(payrun__year=int(year))

        return qs.select_related("employee", "payrun")


# ---------------------------------------------------------------------------
# Payslip Detail  —  GET /api/payroll/payslips/<uuid>/
# ---------------------------------------------------------------------------
class PayslipDetailView(generics.RetrieveAPIView):
    """
    Get a single payslip. Employee can only view own.
    Payroll/Admin can view any in their org.
    """

    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        user = self.request.user

        if user.role in ("ADMIN", "PAYROLL_OFFICER"):
            return Payslip.objects.filter(
                payrun__organization=user.organization
            ).select_related("employee", "payrun")
        else:
            return Payslip.objects.filter(
                employee=user,
                payrun__status=PayrunStatus.FINALIZED,
            ).select_related("employee", "payrun")

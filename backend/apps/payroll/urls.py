from django.urls import path

from . import views

app_name = "payroll"

urlpatterns = [
    # Salary structure
    path(
        "salary/structure/",
        views.SalaryStructureListView.as_view(),
        name="salary-structure-list",
    ),
    path(
        "salary/structure/<uuid:pk>/",
        views.SalaryStructureDetailView.as_view(),
        name="salary-structure-detail",
    ),
    # Payruns
    path(
        "payroll/payruns/",
        views.PayrunListCreateView.as_view(),
        name="payrun-list-create",
    ),
    path(
        "payroll/payruns/<uuid:pk>/process/",
        views.PayrunProcessView.as_view(),
        name="payrun-process",
    ),
    path(
        "payroll/payruns/<uuid:pk>/finalize/",
        views.PayrunFinalizeView.as_view(),
        name="payrun-finalize",
    ),
    # Payslips
    path(
        "payroll/payslips/",
        views.PayslipListView.as_view(),
        name="payslip-list",
    ),
    path(
        "payroll/payslips/<uuid:pk>/",
        views.PayslipDetailView.as_view(),
        name="payslip-detail",
    ),
]

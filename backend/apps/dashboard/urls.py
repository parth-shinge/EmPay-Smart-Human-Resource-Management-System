from django.urls import path

from . import views

app_name = "dashboard"

urlpatterns = [
    path(
        "dashboard/stats/",
        views.DashboardStatsView.as_view(),
        name="dashboard-stats",
    ),
    path(
        "dashboard/attendance-chart/",
        views.AttendanceChartView.as_view(),
        name="attendance-chart",
    ),
    path(
        "dashboard/payroll-summary/",
        views.PayrollSummaryView.as_view(),
        name="payroll-summary",
    ),
]

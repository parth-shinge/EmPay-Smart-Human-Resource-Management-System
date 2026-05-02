from django.urls import path

from . import views

app_name = "attendance"

urlpatterns = [
    path("attendance/checkin/", views.CheckInView.as_view(), name="checkin"),
    path("attendance/checkout/", views.CheckOutView.as_view(), name="checkout"),
    path("attendance/my/", views.MyAttendanceView.as_view(), name="my-attendance"),
    path("attendance/all/", views.AllAttendanceView.as_view(), name="all-attendance"),
    path(
        "attendance/employee/<uuid:pk>/",
        views.EmployeeAttendanceView.as_view(),
        name="employee-attendance",
    ),
    path(
        "attendance/summary/",
        views.AttendanceSummaryView.as_view(),
        name="attendance-summary",
    ),
]

from django.urls import path

from . import views

app_name = "leave"

urlpatterns = [
    path("leave/types/", views.LeaveTypeListView.as_view(), name="leave-types"),
    path(
        "leave/allocations/",
        views.LeaveAllocationListCreateView.as_view(),
        name="leave-allocations",
    ),
    path("leave/balance/", views.LeaveBalanceView.as_view(), name="leave-balance"),
    path(
        "leave/requests/",
        views.LeaveRequestListCreateView.as_view(),
        name="leave-requests",
    ),
    path(
        "leave/requests/all/",
        views.LeaveRequestAllView.as_view(),
        name="leave-requests-all",
    ),
    path(
        "leave/requests/<int:pk>/decide/",
        views.LeaveRequestDecideView.as_view(),
        name="leave-request-decide",
    ),
]

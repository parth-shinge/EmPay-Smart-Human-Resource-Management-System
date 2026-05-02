from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .permissions import IsHROrAdmin
from .serializers import (
    CreateEmployeeSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


# ---------------------------------------------------------------------------
# Auth Views
# ---------------------------------------------------------------------------
class RegisterView(generics.CreateAPIView):
    """Public endpoint — register a new organization + admin user."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(serializer.to_representation(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Public endpoint — authenticate and return JWT tokens + user info."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.to_representation(serializer.validated_data), status=status.HTTP_200_OK)


class ProfileView(APIView):
    """GET/PATCH own profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


# ---------------------------------------------------------------------------
# Employee Management Views (HR / Admin)
# ---------------------------------------------------------------------------
class EmployeeListCreateView(generics.ListCreateAPIView):
    """
    GET  — list all employees in the requester's organization.
    POST — create a new employee (Admin/HR only).
    """

    permission_classes = [IsHROrAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateEmployeeSerializer
        return UserSerializer

    def get_queryset(self):
        qs = User.objects.filter(organization=self.request.user.organization)

        # Optional filters
        department = self.request.query_params.get("department")
        if department:
            qs = qs.filter(department__iexact=department)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)

        return qs


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PATCH/DELETE a single employee — Admin/HR only.
    """

    serializer_class = UserSerializer
    permission_classes = [IsHROrAdmin]
    lookup_field = "pk"

    def get_queryset(self):
        return User.objects.filter(organization=self.request.user.organization)

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return UserUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(instance).data)


# ---------------------------------------------------------------------------
# Employee Directory (all authenticated users)
# ---------------------------------------------------------------------------
class EmployeeDirectoryView(generics.ListAPIView):
    """
    GET — read-only list of all employees in the organization.
    Available to all authenticated users.
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(organization=self.request.user.organization)

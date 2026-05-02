import re

from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Organization, User, UserRole


# ---------------------------------------------------------------------------
# Register Serializer
# ---------------------------------------------------------------------------
class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)
    organization_name = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("user with this email already exists.")
        return value

    def validate_password(self, value):
        if not re.search(r"\d", value):
            raise serializers.ValidationError(
                "Password must contain at least one digit."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        org = Organization.objects.create(name=validated_data["organization_name"])
        user = User.objects.create_user(
            email=validated_data["email"],
            name=validated_data["name"],
            password=validated_data["password"],
            organization=org,
            role=UserRole.ADMIN,
            is_staff=True,
        )
        return user

    def to_representation(self, instance):
        refresh = RefreshToken.for_user(instance)
        return {
            "id": str(instance.id),
            "email": instance.email,
            "name": instance.name,
            "role": instance.role,
            "organization": {
                "id": str(instance.organization.id),
                "name": instance.organization.name,
            },
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
        }


# ---------------------------------------------------------------------------
# Login Serializer
# ---------------------------------------------------------------------------
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            email=attrs["email"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        attrs["user"] = user
        return attrs

    def to_representation(self, instance):
        # instance is the validated_data dict containing 'user'
        user = instance["user"]
        refresh = RefreshToken.for_user(user)
        org_data = None
        if user.organization:
            org_data = {"id": str(user.organization.id), "name": user.organization.name}
        return {
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "department": user.department,
                "designation": user.designation,
                "organization": org_data,
            },
        }


# ---------------------------------------------------------------------------
# Organization Nested Serializer
# ---------------------------------------------------------------------------
class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "address"]
        read_only_fields = ["id"]


# ---------------------------------------------------------------------------
# User Serializer (read-only, full detail)
# ---------------------------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "role",
            "organization",
            "department",
            "designation",
            "date_of_joining",
            "phone",
            "profile_picture",
            "is_active",
        ]
        read_only_fields = ["id", "email", "role", "organization", "is_active"]


# ---------------------------------------------------------------------------
# User Update Serializer (partial update for profile)
# ---------------------------------------------------------------------------
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "phone", "department", "designation", "profile_picture", "role"]


# ---------------------------------------------------------------------------
# Create Employee Serializer (Admin/HR creates employees)
# ---------------------------------------------------------------------------
class CreateEmployeeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.EMPLOYEE)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    designation = serializers.CharField(max_length=100, required=False, allow_blank=True)
    date_of_joining = serializers.DateField(required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("user with this email already exists.")
        return value

    def validate_password(self, value):
        if not re.search(r"\d", value):
            raise serializers.ValidationError(
                "Password must contain at least one digit."
            )
        return value

    def create(self, validated_data):
        request = self.context["request"]
        organization = request.user.organization
        password = validated_data.pop("password")
        user = User.objects.create_user(
            password=password,
            organization=organization,
            **validated_data,
        )
        return user

    def to_representation(self, instance):
        return UserSerializer(instance).data

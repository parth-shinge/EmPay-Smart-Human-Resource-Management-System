from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------
class Organization(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# User Role Choices
# ---------------------------------------------------------------------------
class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    HR_OFFICER = "HR_OFFICER", "HR Officer"
    PAYROLL_OFFICER = "PAYROLL_OFFICER", "Payroll Officer"
    EMPLOYEE = "EMPLOYEE", "Employee"


# ---------------------------------------------------------------------------
# Custom User Manager
# ---------------------------------------------------------------------------
class UserManager(BaseUserManager):
    """Custom manager for User model using email as the identifier."""

    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, name, password, **extra_fields)


# ---------------------------------------------------------------------------
# User Model (AbstractBaseUser + PermissionsMixin)
# ---------------------------------------------------------------------------
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=255, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE,
        db_index=True,
    )
    organization = models.ForeignKey(
        "Organization",
        on_delete=models.CASCADE,
        related_name="members",
    )
    department = models.CharField(max_length=100, null=True, blank=True)
    designation = models.CharField(max_length=100, null=True, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pics/", null=True, blank=True
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["organization", "role"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.email})"

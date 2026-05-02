from django.contrib import admin

from .models import Organization, User


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "address", "created_at")
    search_fields = ("name",)
    ordering = ("-created_at",)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "role", "organization", "department", "is_active")
    list_filter = ("role", "is_active", "organization")
    search_fields = ("email", "name", "department")
    ordering = ("name",)
    readonly_fields = ("id", "last_login")

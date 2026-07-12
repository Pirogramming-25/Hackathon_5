from django.contrib import admin

from .models import Badge, HelperProfile


@admin.register(HelperProfile)
class HelperProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number", "is_verified", "created_at")


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("helper", "help_request", "awarded_at")

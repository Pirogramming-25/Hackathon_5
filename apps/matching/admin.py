from django.contrib import admin

from .models import HelpRequest


@admin.register(HelpRequest)
class HelpRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "user_session_key", "helper", "created_at", "matched_at", "completed_at")
    list_filter = ("status",)

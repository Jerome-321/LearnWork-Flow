from django.contrib import admin

from .models import Task, UserProgress, CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "is_verified", "is_staff", "is_active")
    list_filter = ("is_verified", "is_staff", "is_active")
    search_fields = ("username", "email")
    ordering = ("-date_joined",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "category", "priority", "completed", "points")
    list_filter = ("category", "priority", "completed")
    search_fields = ("title", "description")
    ordering = ("-createdAt",)


@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "totalPoints", "tasksCompleted", "petLevel", "petStage")

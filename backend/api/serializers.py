from rest_framework import serializers
from .models import Task, Notification, UserNotificationSettings, WorkSchedule, Streak

class TaskSerializer(serializers.ModelSerializer):

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ["user"]

class WorkScheduleSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkSchedule
        fields = "__all__"
        read_only_fields = ["user", "created_at"]


# ✅ NEW: Serializer for notifications
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "notification_type", "title", "message", "task", "is_read", "createdAt"]
        read_only_fields = ["user", "createdAt"]


# ✅ NEW: Serializer for notification settings
class UserNotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotificationSettings
        fields = [
            "notifications_enabled",
            "task_reminders",
            "task_completed",
            "pet_updates",
            "ai_suggestions",
            "daily_reminders"
        ]


class StreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Streak
        fields = ["id", "current_streak", "longest_streak", "last_completed_date", "total_days_active", "created_at", "updated_at"]
        read_only_fields = ["user", "created_at", "updated_at"]
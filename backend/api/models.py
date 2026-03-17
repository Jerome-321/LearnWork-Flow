from django.db import models
from django.contrib.auth.models import User


class Task(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    category = models.CharField(max_length=50)
    priority = models.CharField(max_length=20)

    dueDate = models.DateTimeField(null=True, blank=True)

    estimatedDuration = models.IntegerField(default=60)

    completed = models.BooleanField(default=False)

    points = models.IntegerField(default=0)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class UserProgress(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    totalPoints = models.IntegerField(default=0)
    tasksCompleted = models.IntegerField(default=0)

    petLevel = models.IntegerField(default=1)
    petStage = models.CharField(max_length=20, default="egg")

    lastCompletedDate = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} Progress"


# ✅ NEW: Notification settings for user preferences
class UserNotificationSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_settings")
    
    # Main toggle
    notifications_enabled = models.BooleanField(default=True)
    
    # Notification type toggles
    task_reminders = models.BooleanField(default=True)
    task_completed = models.BooleanField(default=True)
    pet_updates = models.BooleanField(default=True)
    ai_suggestions = models.BooleanField(default=True)
    daily_reminders = models.BooleanField(default=False)
    
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} Notification Settings"


# ✅ NEW: Store notifications for display
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("task_reminder", "Task Reminder"),
        ("task_completed", "Task Completed"),
        ("pet_update", "Pet Update"),
        ("ai_suggestion", "AI Suggestion"),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Link to related task if applicable
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Read status
    is_read = models.BooleanField(default=False)
    
    createdAt = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-createdAt"]
    
    def __str__(self):
        return f"{self.notification_type}: {self.title}"
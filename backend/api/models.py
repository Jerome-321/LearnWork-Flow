from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta


class CustomUser(AbstractUser):
    """
    Custom User model with OTP verification fields
    """
    is_verified = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    has_completed_schedule = models.BooleanField(default=False)

    def is_otp_expired(self):
        """Check if OTP is expired (valid for 5 minutes)"""
        if not self.otp_created_at:
            return True
        return timezone.now() > self.otp_created_at + timedelta(minutes=5)

    def clear_otp(self):
        """Clear OTP fields after verification"""
        self.otp = None
        self.otp_created_at = None
        self.save()

    def can_resend_otp(self):
        """Check if OTP can be resent (rate limiting: 60 seconds)"""
        if not self.otp_created_at:
            return True
        return timezone.now() > self.otp_created_at + timedelta(seconds=60)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_set',
        related_query_name='customuser',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_set',
        related_query_name='customuser',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class Task(models.Model):

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    category = models.CharField(max_length=50)
    priority = models.CharField(max_length=20)

    dueDate = models.DateTimeField(null=True, blank=True)

    estimatedDuration = models.IntegerField(default=60)

    completed = models.BooleanField(default=False)

    points = models.IntegerField(default=0)

    # Add image and link fields
    image = models.ImageField(upload_to='task_images/', null=True, blank=True)
    link = models.URLField(null=True, blank=True)

    # Notification flags to prevent duplicates
    notified_1d = models.BooleanField(default=False)
    notified_5h = models.BooleanField(default=False)
    notified_1h = models.BooleanField(default=False)
    notified_5m = models.BooleanField(default=False)
    notified_overdue = models.BooleanField(default=False)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class WorkSchedule(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    job_title = models.CharField(max_length=255, blank=True, default='')
    work_days = models.JSONField(default=list)
    start_time = models.TimeField()
    end_time = models.TimeField()
    work_type = models.CharField(max_length=50)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job_title} ({self.user.username})"

class UserProgress(models.Model):

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)

    totalPoints = models.IntegerField(default=0)
    tasksCompleted = models.IntegerField(default=0)

    petLevel = models.IntegerField(default=1)
    petStage = models.CharField(max_length=20, default="egg")

    currentStreak = models.IntegerField(default=0)
    longestStreak = models.IntegerField(default=0)
    lastCompletedDate = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} Progress"


# ✅ NEW: Notification settings for user preferences
class UserNotificationSettings(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="notification_settings")
    
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


# ✅ NEW: Store push subscriptions so we can avoid duplicates and manage unsubscription
class PushSubscription(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.TextField(unique=True)
    p256dh = models.CharField(max_length=512, blank=True, null=True)
    auth = models.CharField(max_length=512, blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PushSubscription({self.user.username}, {self.endpoint})"


# ✅ NEW: Store notifications for display
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("task_reminder", "Task Reminder"),
        ("task_completed", "Task Completed"),
        ("pet_update", "Pet Update"),
        ("ai_suggestion", "AI Suggestion"),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications")
    
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
        
from django.contrib.auth.models import User
from django.db import models

class EmailOTP(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} OTP"
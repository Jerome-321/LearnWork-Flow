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
    
    # Fixed event flag - cannot be rescheduled by AI
    is_fixed = models.BooleanField(default=False)

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
        

class EmailOTP(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} OTP"


class Streak(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="streak")
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_completed_date = models.DateField(null=True, blank=True)
    total_days_active = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Streak: {self.current_streak} days"


# ✅ Q6 FEEDBACK LOOP: Track task completions for ML learning
class CompletionLog(models.Model):
    """Track when and where users complete tasks for ML adaptation (Q6)"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="completion_logs")
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True)
    
    # Scheduled time slot vs actual completion
    scheduled_time = models.TimeField()  # When AI suggested the task
    scheduled_day = models.CharField(max_length=10)  # Monday, Tuesday, etc.
    actual_completion_time = models.TimeField()  # When user actually completed it
    actual_completion_date = models.DateField()
    
    # Task characteristics
    task_title = models.CharField(max_length=255)
    task_category = models.CharField(max_length=50)
    task_priority = models.CharField(max_length=20)
    estimated_duration = models.IntegerField(default=60)  # minutes
    actual_duration = models.IntegerField(null=True, blank=True)  # minutes
    
    # Completion quality
    was_completed = models.BooleanField(default=True)
    completion_quality = models.IntegerField(default=100)  # 0-100 score
    user_satisfaction = models.IntegerField(null=True, blank=True)  # User rating 1-5
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-actual_completion_date']
        indexes = [
            models.Index(fields=['user', 'actual_completion_date']),
            models.Index(fields=['user', 'scheduled_day']),
        ]
    
    def __str__(self):
        return f"{self.user.username} completed {self.task_title} on {self.actual_completion_date}"


# ✅ Q6 LEARNING: User productivity patterns per time slot
class BehaviorHistory(models.Model):
    """
    Machine learning history: tracks productivity patterns per user per time slot.
    Updated after each task completion to learn user's actual rhythm (Q6).
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="behavior_history")
    
    # Time slot characteristics
    day_of_week = models.CharField(max_length=10)  # Monday, Tuesday, etc.
    time_slot = models.TimeField()  # 09:00, 10:00, etc.
    time_window = models.CharField(max_length=30)  # "morning", "afternoon", "evening", "night"
    
    # Productivity metrics
    completion_rate = models.FloatField(default=0.5)  # 0-1: tasks completed vs abandoned
    avg_completion_time = models.IntegerField(default=60)  # minutes
    historical_productivity_score = models.FloatField(default=50.0)  # 0-100
    
    # Learning data
    total_tasks_scheduled = models.IntegerField(default=0)
    completed_tasks = models.IntegerField(default=0)
    abandoned_tasks = models.IntegerField(default=0)
    avg_satisfaction_rating = models.FloatField(default=3.0)  # 1-5 stars
    
    # Pattern recognition
    weekend_pattern = models.BooleanField(default=False)  # Special weekend productivity
    exam_week_boost = models.BooleanField(default=False)  # Extra productivity during exams
    post_shift_recovery = models.BooleanField(default=False)  # Less productive after work
    
    # ML model feedback
    ml_confidence_score = models.FloatField(default=0.5)  # Model confidence 0-1
    last_updated = models.DateTimeField(auto_now=True)
    update_count = models.IntegerField(default=0)  # How many times this was updated
    
    class Meta:
        unique_together = ('user', 'day_of_week', 'time_slot')
        ordering = ['day_of_week', 'time_slot']
        indexes = [
            models.Index(fields=['user', 'day_of_week', 'time_slot']),
            models.Index(fields=['user', 'historical_productivity_score']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.day_of_week} @ {self.time_slot} (Score: {self.historical_productivity_score:.1f})"


# ✅ Q2 RECURRING: Detect and track recurring conflicts
class RecurringConflict(models.Model):
    """
    Tracks recurring conflicts (e.g., every Wednesday 2-4pm has same conflict).
    Triggers recommendation to restructure after 3 occurrences (Q2).
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="recurring_conflicts")
    
    # Conflict characteristics
    conflict_type = models.CharField(max_length=50)  # "task_vs_work", "task_vs_task", "task_vs_fixed"
    day_of_week = models.CharField(max_length=10)  # Monday, Tuesday, etc.
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Items in conflict
    item1_title = models.CharField(max_length=255)
    item2_title = models.CharField(max_length=255)
    item1_type = models.CharField(max_length=50)  # "task", "work_shift", "fixed_event"
    item2_type = models.CharField(max_length=50)
    
    # Recurrence tracking
    occurrence_count = models.IntegerField(default=1)
    first_detected = models.DateField(auto_now_add=True)
    last_occurred = models.DateField(auto_now=True)
    acknowledged_count = models.IntegerField(default=0)  # User ignored warning this many times
    
    # Resolution status
    is_active = models.BooleanField(default=True)
    user_suggested_resolution = models.TextField(blank=True)  # User's notes on resolving it
    ai_suggestion_accepted = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-last_occurred']
        indexes = [
            models.Index(fields=['user', 'day_of_week']),
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.item1_title} vs {self.item2_title} ({self.occurrence_count}x)"


# ✅ Q10 PLANNED: Store conflict resolutions for history replay
class ConflictHistory(models.Model):
    """
    Stores past conflict resolutions so AI can offer "apply same resolution?"
    on similar future conflicts (Q10 future feature).
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="conflict_history")
    
    # Original conflict
    conflict_date = models.DateField()
    conflict_type = models.CharField(max_length=50)  # "task_vs_work", "task_vs_task", "task_vs_fixed"
    item1_title = models.CharField(max_length=255)
    item2_title = models.CharField(max_length=255)
    item1_category = models.CharField(max_length=50)
    item2_category = models.CharField(max_length=50)
    
    # How it was resolved
    resolution_type = models.CharField(max_length=50)  # "reschedule", "split", "negotiate", "defer"
    resolution_details = models.JSONField()  # Flexible JSON for resolution specifics
    resolution_description = models.TextField()  # Human-readable explanation
    
    # AI reasoning
    groq_reasoning = models.TextField()  # What Groq AI said about this conflict
    user_selected_option = models.IntegerField()  # Which option number (1, 2, 3)
    user_satisfaction_with_resolution = models.IntegerField(null=True, blank=True)  # 1-5 stars
    
    # Similarity matching for future conflicts
    item1_keywords = models.CharField(max_length=500)  # Comma-separated keywords
    item2_keywords = models.CharField(max_length=500)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-conflict_date']
        indexes = [
            models.Index(fields=['user', 'conflict_type']),
            models.Index(fields=['user', 'item1_category', 'item2_category']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.item1_title} vs {self.item2_title} ({self.resolution_type})"


# ✅ Q6 ML FEEDBACK: Track score adjustments
class UserFeedbackScore(models.Model):
    """
    Tracks when and why ML productivity scores were adjusted based on user behavior.
    Used to explain score changes to user (Q6).
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="feedback_scores")
    
    # What changed
    day_of_week = models.CharField(max_length=10)
    time_slot = models.TimeField()
    
    # Score adjustment
    old_score = models.FloatField()  # Previous productivity score
    new_score = models.FloatField()  # Updated productivity score
    adjustment_reason = models.CharField(max_length=255)  # "User consistently completes here", etc.
    
    # Evidence
    completion_rate_change = models.FloatField()  # How much completion rate changed
    recent_task_count = models.IntegerField()  # How many recent tasks inform this
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'day_of_week', 'time_slot']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.day_of_week} @ {self.time_slot}: {self.old_score:.1f} → {self.new_score:.1f}"
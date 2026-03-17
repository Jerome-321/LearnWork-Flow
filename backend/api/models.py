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
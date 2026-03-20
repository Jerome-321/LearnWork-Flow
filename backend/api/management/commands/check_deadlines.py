"""
Management command to check for upcoming task deadlines and send push notifications.
Run this periodically (every 5 minutes) using a scheduler like cron or Windows Task Scheduler.

Usage:
    python manage.py check_deadlines
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Task, UserNotificationSettings, PushSubscription
from api.views import send_push_to_user
import json


class Command(BaseCommand):
    help = 'Check for upcoming task deadlines and send push notifications'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Define notification windows
        windows = [
            {'name': '1 day', 'hours': 24, 'flag': 'notified_1d', 'tolerance_minutes': 30},
            {'name': '5 hours', 'hours': 5, 'flag': 'notified_5h', 'tolerance_minutes': 15},
            {'name': '1 hour', 'hours': 1, 'flag': 'notified_1h', 'tolerance_minutes': 10},
            {'name': '5 minutes', 'minutes': 5, 'flag': 'notified_5m', 'tolerance_minutes': 2},
        ]
        
        total_sent = 0
        
        for window in windows:
            # Calculate time window
            if 'hours' in window:
                target_time = now + timedelta(hours=window['hours'])
            else:
                target_time = now + timedelta(minutes=window['minutes'])
            
            tolerance = timedelta(minutes=window['tolerance_minutes'])
            window_start = target_time - tolerance
            window_end = target_time + tolerance
            
            # Find tasks in this window that haven't been notified
            tasks = Task.objects.filter(
                completed=False,
                dueDate__isnull=False,
                dueDate__gte=window_start,
                dueDate__lte=window_end,
                **{window['flag']: False}
            ).select_related('user')
            
            self.stdout.write(f"\n[{window['name']}] Checking window: {window_start} to {window_end}")
            self.stdout.write(f"[{window['name']}] Found {tasks.count()} tasks")
            
            for task in tasks:
                # Check if user has notifications enabled
                settings, _ = UserNotificationSettings.objects.get_or_create(user=task.user)
                
                if not settings.notifications_enabled or not settings.task_reminders:
                    self.stdout.write(f"  [SKIP] {task.user.username} - notifications disabled")
                    continue
                
                # Check if user has push subscriptions
                if not PushSubscription.objects.filter(user=task.user).exists():
                    self.stdout.write(f"  [SKIP] {task.user.username} - no push subscriptions")
                    continue
                
                # Calculate exact time remaining
                time_remaining = task.dueDate - now
                hours_remaining = int(time_remaining.total_seconds() / 3600)
                minutes_remaining = int(time_remaining.total_seconds() / 60)
                
                # Format time string
                if hours_remaining >= 24:
                    time_str = f"{hours_remaining // 24} day(s)"
                elif hours_remaining >= 1:
                    time_str = f"{hours_remaining} hour(s)"
                else:
                    time_str = f"{minutes_remaining} minute(s)"
                
                # Create notification payload
                payload = {
                    "title": f"Task Due Soon!",
                    "body": f"'{task.title}' is due in {time_str}",
                    "url": "/",
                    "icon": "/favicon.ico",
                    "tag": f"task-{task.id}-{window['flag']}",
                    "requireInteraction": True
                }
                
                # Send push notification
                result = send_push_to_user(task.user, payload)
                
                if result.get('success'):
                    # Mark as notified
                    setattr(task, window['flag'], True)
                    task.save(update_fields=[window['flag']])
                    total_sent += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  [OK] Sent to {task.user.username}: '{task.title}' ({time_str})"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            f"  [FAIL] Failed to send to {task.user.username}: {result.get('message')}"
                        )
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f"\n[SUCCESS] Deadline check complete. Sent {total_sent} notification(s).")
        )

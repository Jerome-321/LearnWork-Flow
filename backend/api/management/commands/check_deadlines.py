from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Task, UserNotificationSettings, PushSubscription, Notification
from api.views import send_push_to_user
from api.utils import send_task_email  # 🔥 ADD THIS
import json


class Command(BaseCommand):
    help = 'Check for upcoming task deadlines and overdue tasks, send notifications'

    def handle(self, *args, **options):
        now = timezone.now()

        windows = [
            {'name': '1 day', 'hours': 24, 'flag': 'notified_1d', 'tolerance_minutes': 30},
            {'name': '5 hours', 'hours': 5, 'flag': 'notified_5h', 'tolerance_minutes': 15},
            {'name': '1 hour', 'hours': 1, 'flag': 'notified_1h', 'tolerance_minutes': 10},
            {'name': '5 minutes', 'minutes': 5, 'flag': 'notified_5m', 'tolerance_minutes': 2},
        ]

        total_sent = 0
        
        # 🔴 CHECK FOR OVERDUE TASKS FIRST
        self.stdout.write("\n" + "="*60)
        self.stdout.write("CHECKING FOR OVERDUE TASKS...")
        self.stdout.write("="*60)
        total_sent += self.check_overdue_tasks(now)
        
        # 🟡 CHECK FOR UPCOMING DEADLINES
        self.stdout.write("\n" + "="*60)
        self.stdout.write("CHECKING FOR UPCOMING DEADLINES...")
        self.stdout.write("="*60)

        for window in windows:

            # Calculate time window
            if 'hours' in window:
                target_time = now + timedelta(hours=window['hours'])
            else:
                target_time = now + timedelta(minutes=window['minutes'])

            tolerance = timedelta(minutes=window['tolerance_minutes'])
            window_start = target_time - tolerance
            window_end = target_time + tolerance

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

                settings, _ = UserNotificationSettings.objects.get_or_create(user=task.user)

                if not settings.notifications_enabled or not settings.task_reminders:
                    self.stdout.write(f"  [SKIP] {task.user.username} - notifications disabled")
                    continue

                if not PushSubscription.objects.filter(user=task.user).exists():
                    self.stdout.write(f"  [SKIP] {task.user.username} - no push subscriptions")
                    continue

                # Calculate time remaining
                time_remaining = task.dueDate - now
                hours_remaining = int(time_remaining.total_seconds() / 3600)
                minutes_remaining = int(time_remaining.total_seconds() / 60)

                if hours_remaining >= 24:
                    time_str = f"{hours_remaining // 24} day(s)"
                elif hours_remaining >= 1:
                    time_str = f"{hours_remaining} hour(s)"
                else:
                    time_str = f"{minutes_remaining} minute(s)"

                payload = {
                    "title": f"Task Due Soon!",
                    "body": f"'{task.title}' is due in {time_str}",
                    "url": "/",
                    "icon": "/favicon.ico",
                    "tag": f"task-{task.id}-{window['flag']}",
                    "requireInteraction": True
                }

                # 🔔 SEND PUSH
                result = send_push_to_user(task.user, payload)

                if result.get('success'):

                    # ✅ mark as notified
                    setattr(task, window['flag'], True)
                    task.save(update_fields=[window['flag']])

                    # � CREATE NOTIFICATION RECORD
                    Notification.objects.create(
                        user=task.user,                        notification_type="task_reminder",                        title=payload['title'],
                        message=payload['body'],
                        task=task
                    )

                    # �🔥 SEND EMAIL
                    send_task_email(
                        task.user.email,
                        task.title,
                        time_str,
                        task.id
                    )

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
    
    def check_overdue_tasks(self, now):
        """
        🔴 Check for overdue tasks and notify users
        Tasks are overdue if dueDate < now and not notified yet
        """
        overdue_tasks = Task.objects.filter(
            completed=False,
            dueDate__isnull=False,
            dueDate__lt=now,
            notified_overdue=False
        ).select_related('user')
        
        self.stdout.write(f"\n[OVERDUE] Found {overdue_tasks.count()} overdue tasks")
        
        total_sent = 0
        
        for task in overdue_tasks:
            settings, _ = UserNotificationSettings.objects.get_or_create(user=task.user)
            
            if not settings.notifications_enabled or not settings.task_reminders:
                self.stdout.write(f"  [SKIP] {task.user.username} - notifications disabled")
                continue
            
            if not PushSubscription.objects.filter(user=task.user).exists():
                self.stdout.write(f"  [SKIP] {task.user.username} - no push subscriptions")
                continue
            
            # Calculate how long overdue
            time_overdue = now - task.dueDate
            days_overdue = int(time_overdue.total_seconds() / 86400)
            hours_overdue = int(time_overdue.total_seconds() / 3600)
            
            if days_overdue > 0:
                time_str = f"{days_overdue} day(s) overdue"
            else:
                time_str = f"{hours_overdue} hour(s) overdue"
            
            # 🔴 Create overdue notification payload
            payload = {
                "title": "📛 Task Overdue!",
                "body": f"'{task.title}' is {time_str}",
                "url": f"/tasks/{task.id}",
                "icon": "/favicon.ico",
                "tag": f"task-{task.id}-overdue",
                "requireInteraction": True
            }
            
            # 🔔 SEND PUSH
            result = send_push_to_user(task.user, payload)
            
            if result.get('success'):
                # ✅ Mark as notified
                task.notified_overdue = True
                task.save(update_fields=['notified_overdue'])
                
                # 🔥 SEND EMAIL
                send_task_email(
                    task.user.email,
                    task.title,
                    time_str,
                    task.id
                )
                
                # 📝 Create notification record
                Notification.objects.create(
                    user=task.user,
                    notification_type="task_reminder",
                    title="Task Overdue",
                    message=f"'{task.title}' is {time_str}",
                    task=task
                )
                
                total_sent += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  [OK] Overdue notification sent to {task.user.username}: '{task.title}' ({time_str})"
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f"  [FAIL] Failed to send overdue notification to {task.user.username}: {result.get('message')}"
                    )
                )
        
        return total_sent
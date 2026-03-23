from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Task, PushSubscription
from api.utils import send_task_email  # 🔥 ADD THIS
from pywebpush import webpush, WebPushException
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send push notifications for upcoming task due dates'

    def handle(self, *args, **options):
        self.stdout.write('Checking for tasks requiring notifications...')

        now = timezone.now()
        tasks_processed = 0
        notifications_sent = 0

        tasks = Task.objects.filter(
            completed=False,
            dueDate__isnull=False
        ).select_related('user')

        for task in tasks:
            tasks_processed += 1

            time_diff = task.dueDate - now
            hours_remaining = time_diff.total_seconds() / 3600
            minutes_remaining = time_diff.total_seconds() / 60

            # 🔹 1 DAY
            if hours_remaining <= 24 and hours_remaining > 23 and not task.notified_1d:

                self.send_notification(task, '1 day', '/tasks')

                # 🔥 EMAIL
                send_task_email(task.user.email, task.title, "1 day",task.id)

                task.notified_1d = True
                task.save()
                notifications_sent += 1

            # 🔹 5 HOURS
            elif hours_remaining <= 5 and hours_remaining > 4 and not task.notified_5h:

                self.send_notification(task, '5 hours', '/tasks')

                send_task_email(task.user.email, task.title, "5 hours",task.id)

                task.notified_5h = True
                task.save()
                notifications_sent += 1

            # 🔹 1 HOUR
            elif hours_remaining <= 1 and hours_remaining > 0.75 and not task.notified_1h:

                self.send_notification(task, '1 hour', '/tasks')

                send_task_email(task.user.email, task.title, "1 hour", task.id)

                task.notified_1h = True
                task.save()
                notifications_sent += 1

            # 🔹 5 MINUTES
            elif minutes_remaining <= 5 and minutes_remaining > 0 and not task.notified_5m:

                self.send_notification(task, '5 minutes', '/tasks')

                send_task_email(task.user.email, task.title, "5 minutes",task.id)

                task.notified_5m = True
                task.save()
                notifications_sent += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Processed {tasks_processed} tasks, sent {notifications_sent} notifications'
            )
        )

    def send_notification(self, task, time_remaining, url):
        """Send push notification to all subscriptions for this user"""
        try:
            subscriptions = PushSubscription.objects.filter(user=task.user)

            if not subscriptions.exists():
                logger.warning(f'No push subscriptions found for user {task.user.id}')
                return

            payload = {
                "title": "Task Reminder",
                "body": f"Your task '{task.title}' is due in {time_remaining}",
                "url": url,
                "taskId": task.id
            }

            from django.conf import settings
            vapid_private_key = getattr(settings, 'VAPID_PRIVATE_KEY', None)
            vapid_email = getattr(settings, 'VAPID_EMAIL', None)

            if not vapid_private_key or not vapid_email:
                logger.error('VAPID keys not configured')
                return

            vapid_claims = {
                "sub": vapid_email
            }

            import json
            payload_str = json.dumps(payload)

            for subscription in subscriptions:
                try:
                    webpush(
                        subscription_info={
                            "endpoint": subscription.endpoint,
                            "keys": {
                                "p256dh": subscription.p256dh,
                                "auth": subscription.auth
                            }
                        },
                        data=payload_str,
                        vapid_private_key=vapid_private_key,
                        vapid_claims=vapid_claims
                    )
                    logger.info(f'Sent notification for task {task.id} to user {task.user.id}')

                except WebPushException as e:
                    logger.error(f'Failed to send push notification: {e}')

        except Exception as e:
            logger.error(f'Error sending notification for task {task.id}: {e}')
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
from django.utils import timezone

from .models import Task, UserProgress, Notification, UserNotificationSettings, PushSubscription
from .serializers import TaskSerializer, NotificationSerializer, UserNotificationSettingsSerializer

from rest_framework.decorators import api_view, permission_classes
from .ai.ai_service import generate_schedule

# Push notification utilities
from pywebpush import webpush, WebPushException
import json

# TASK VIEWSET
from datetime import datetime

from rest_framework.permissions import AllowAny

def format_time_12h(time_str):
    try:
        t = datetime.strptime(time_str, "%H:%M")
        return t.strftime("%I:%M %p").lstrip("0")
    except:
        return time_str
    
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by("-createdAt")

    def perform_create(self, serializer):
        task = serializer.save(user=self.request.user)
        
        # ✅ NEW: Create notification for new task
        create_notification(
            user=self.request.user,
            notification_type="task_reminder",
            title=f"New Task Created 📝",
            message=f"'{task.title}' has been added to your tasks.",
            task=task
        )

    def perform_update(self, serializer):
        # ✅ FIX #1: Get original task state BEFORE saving
        try:
            original_task = Task.objects.get(pk=self.kwargs['pk'])
            was_completed = original_task.completed
        except Task.DoesNotExist:
            was_completed = False

        task = serializer.save()

        # ✅ FIX #1: Only award points on TRANSITION incomplete→complete (not every save)
        if task.completed and not was_completed:

            progress, created = UserProgress.objects.get_or_create(
                user=self.request.user
            )

            progress.totalPoints += task.points
            progress.tasksCompleted += 1
            progress.lastCompletedDate = timezone.now()

            # Pet evolution system
            if progress.totalPoints < 100:
                progress.petStage = "egg"
            elif progress.totalPoints < 300:
                progress.petStage = "baby"
            elif progress.totalPoints < 700:
                progress.petStage = "teen"
            elif progress.totalPoints < 1500:
                progress.petStage = "adult"
            else:
                progress.petStage = "master"

            progress.petLevel = progress.totalPoints // 100 + 1

            progress.save()
            
            # ✅ NEW: Create notification for task completion
            create_notification(
                user=self.request.user,
                notification_type="task_completed",
                title="Task Completed! 🎉",
                message=f"You earned {task.points} points for completing '{task.title}'",
                task=task
            )
            
            # ✅ NEW: Create notification for pet level up if applicable
            old_level = created and 1 or max(1, (progress.totalPoints - task.points) // 100 + 1)
            if progress.petLevel > old_level:
                create_notification(
                    user=self.request.user,
                    notification_type="pet_update",
                    title="Your Pet Leveled Up! 🐣➡️🐣",
                    message=f"Your pet has reached level {progress.petLevel}! ({progress.petStage.upper()})",
                    task=None
                )

        # ✅ FIX #1: Remove points if toggled back to incomplete
        elif not task.completed and was_completed and task.points > 0:
            progress, created = UserProgress.objects.get_or_create(
                user=self.request.user
            )
            
            # Subtract points (don't go below 0)
            progress.totalPoints = max(0, progress.totalPoints - task.points)
            progress.tasksCompleted = max(0, progress.tasksCompleted - 1)

            # Recalculate pet stage
            if progress.totalPoints < 100:
                progress.petStage = "egg"
            elif progress.totalPoints < 300:
                progress.petStage = "baby"
            elif progress.totalPoints < 700:
                progress.petStage = "teen"
            elif progress.totalPoints < 1500:
                progress.petStage = "adult"
            else:
                progress.petStage = "master"

            progress.petLevel = max(1, progress.totalPoints // 100 + 1)
            progress.save()


# REGISTER


from api.utils import generate_otp, send_otp_email
from .models import EmailOTP

@api_view(['POST'])
def register(request):
    try:
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        UserProgress.objects.create(user=user)

        otp = generate_otp()

        EmailOTP.objects.update_or_create(
            user=user,
            defaults={"otp": otp, "is_verified": False}
        )

        # 🔥 SAFE EMAIL (won’t crash app)
        try:
            send_otp_email(email, otp)
        except Exception as e:
            print("EMAIL ERROR:", str(e))

        return Response({
            "message": "OTP sent to email"
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def verify_otp(request):
    email = request.data.get("email")
    otp_input = request.data.get("otp")

    try:
        user = User.objects.get(email=email)
        otp_obj = EmailOTP.objects.get(user=user)

        if otp_obj.otp == otp_input:
            otp_obj.is_verified = True
            otp_obj.save()
            return Response({"message": "Verified successfully"})

        return Response({"error": "Invalid OTP"}, status=400)

    except:
        return Response({"error": "User not found"}, status=404)

# LOGIN

@api_view(['POST'])
def login(request):

    email = request.data.get("username")
    password = request.data.get("password")

    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=401)

    user = authenticate(username=user_obj.username, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"}, status=401)

    otp_obj = EmailOTP.objects.get(user=user)

    if not otp_obj.is_verified:
        return Response({"error": "Email not verified"}, status=403)

    refresh = RefreshToken.for_user(user)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    })



# USER PROGRESS API

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def progress(request):

    progress, created = UserProgress.objects.get_or_create(
        user=request.user
    )

    return Response({
        "totalPoints": progress.totalPoints,
        "tasksCompleted": progress.tasksCompleted,
        "petLevel": progress.petLevel,
        "petStage": progress.petStage,
        "currentStreak": progress.currentStreak,
        "longestStreak": progress.longestStreak
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    # Get all users' progress sorted by totalPoints descending
    leaderboard_data = UserProgress.objects.select_related('user').order_by('-totalPoints')
    
    result = []
    for idx, progress in enumerate(leaderboard_data):
        result.append({
            "rank": idx + 1,
            "id": progress.user.id,
            "username": progress.user.username,
            "totalPoints": progress.totalPoints,
            "currentStreak": progress.currentStreak,
            "longestStreak": progress.longestStreak,
            "tasksCompleted": progress.tasksCompleted,
            "petLevel": progress.petLevel,
            "petStage": progress.petStage
        })
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_analyze_task(request):
    # ✅ FIX #4: Validate required fields for AI optimization
    title = request.data.get("title")
    description = request.data.get("description")
    category = request.data.get("category")
    priority = request.data.get("priority")
    dueDate = request.data.get("dueDate")
    estimatedDuration = request.data.get("estimatedDuration")

    # Validate required fields
    if not title:
        return Response({"error": "title is required"}, status=400)
    if not category:
        return Response({"error": "category is required"}, status=400)

    # Get user's existing tasks for context
    tasks = Task.objects.filter(
        user=request.user,
        completed=False
    )

    schedule = []

    for task in tasks:
        if task.dueDate:
            schedule.append({
                "title": task.title,
                "dueDate": task.dueDate.isoformat() if hasattr(task.dueDate, 'isoformat') else str(task.dueDate),
                "priority": task.priority,
                "duration": task.estimatedDuration,
                "completed": task.completed
            })

    # Pass all parameters to AI scheduler for better optimization
    result = generate_schedule({
        "title": title,
        "description": description,
        "category": category,
        "priority": priority or "medium",
        "dueDate": dueDate,
        "estimatedDuration": estimatedDuration or 60,
        "existingTasks": schedule
    })

    return Response(result)


# ✅ NEW: NOTIFICATION APIs

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """
    ✅ Fetch all unread notifications for the user
    """
    notifications = Notification.objects.filter(user=request.user, is_read=False).order_by("-createdAt")[:20]
    serializer = NotificationSerializer(notifications, many=True)
    return Response({
        "notifications": serializer.data,
        "unread_count": notifications.count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request):
    """
    ✅ Mark a notification as read
    """
    notification_id = request.data.get("notification_id")
    
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({"success": True})
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found"}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    ✅ Mark all notifications as read
    """
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"success": True})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_notification_settings(request):
    """
    ✅ Get or update user's notification settings
    """
    settings, created = UserNotificationSettings.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        serializer = UserNotificationSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    serializer = UserNotificationSettingsSerializer(settings)
    return Response(serializer.data)


# ✅ NEW: VAPID public key endpoint for Web Push
@api_view(['GET'])
@permission_classes([AllowAny])
def get_vapid_public_key(request):
    """Return the public VAPID key for push subscription."""
    public_key = getattr(settings, "VAPID_PUBLIC_KEY", "")
    print(f"[VAPID] Sending public key to {request.user.username}: {public_key[:50]}...")
    return Response({
        "public_key": public_key
    })


# ✅ NEW: Subscribe for push notifications
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_push(request):
    """Store a push subscription for the current user."""
    print(f"[SUBSCRIBE] Request from {request.user.username}")
    print(f"[SUBSCRIBE] Request data: {request.data}")
    
    subscription = request.data.get("subscription")
    if not subscription or not isinstance(subscription, dict):
        print(f"[SUBSCRIBE] ERROR: Invalid subscription data")
        return Response({"error": "subscription is required"}, status=400)

    endpoint = subscription.get("endpoint")
    keys = subscription.get("keys", {})
    p256dh = keys.get("p256dh")
    auth = keys.get("auth")

    print(f"[SUBSCRIBE] Endpoint: {endpoint[:50] if endpoint else 'None'}...")
    print(f"[SUBSCRIBE] p256dh: {p256dh[:20] if p256dh else 'None'}...")
    print(f"[SUBSCRIBE] auth: {auth[:20] if auth else 'None'}...")

    if not endpoint:
        print(f"[SUBSCRIBE] ERROR: Missing endpoint")
        return Response({"error": "subscription.endpoint is required"}, status=400)

    try:
        obj, created = PushSubscription.objects.update_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={
                "p256dh": p256dh,
                "auth": auth
            }
        )
        print(f"[SUBSCRIBE] {'Created' if created else 'Updated'} subscription for {request.user.username}")
        return Response({"success": True, "created": created})
    except Exception as e:
        print(f"[SUBSCRIBE] ERROR: {str(e)}")
        return Response({"error": str(e)}, status=500)


# ✅ NEW: Unsubscribe from push notifications
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsubscribe_push(request):
    """Remove a push subscription for the current user."""
    endpoint = request.data.get("endpoint")
    print(f"[UNSUBSCRIBE] Request from {request.user.username}")
    print(f"[UNSUBSCRIBE] Endpoint: {endpoint[:50] if endpoint else 'None'}...")
    
    if not endpoint:
        return Response({"error": "endpoint is required"}, status=400)

    deleted_count, _ = PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
    print(f"[UNSUBSCRIBE] Deleted {deleted_count} subscription(s)")
    return Response({"success": True, "deleted": deleted_count})


# ✅ NEW: Helper function to create notifications
def create_notification(user, notification_type, title, message, task=None):
    """
    ✅ Create a notification if user has enabled that type
    """
    settings, _ = UserNotificationSettings.objects.get_or_create(user=user)
    
    # Check if notifications are globally enabled
    if not settings.notifications_enabled:
        return None
    
    # Check if this specific notification type is enabled
    if notification_type == "task_reminder" and not settings.task_reminders:
        return None
    elif notification_type == "task_completed" and not settings.task_completed:
        return None
    elif notification_type == "pet_update" and not settings.pet_updates:
        return None
    elif notification_type == "ai_suggestion" and not settings.ai_suggestions:
        return None
    
    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        task=task
    )
    return notification


# ✅ NEW: Helper to check and notify about tasks due soon
def check_and_notify_deadline_tasks(user):
    """
    ✅ Check for tasks due within 24 hours and create notifications
    Returns count of notifications created
    """
    from django.utils import timezone
    from datetime import timedelta
    
    notifications_created = 0
    now = timezone.now()
    tomorrow = now + timedelta(hours=24)
    
    # Find incomplete tasks due within 24 hours that haven't been notified yet
    upcoming_tasks = Task.objects.filter(
        user=user,
        completed=False,
        dueDate__isnull=False,
        dueDate__gte=now,
        dueDate__lte=tomorrow
    )
    
    # Track which tasks have been notified to avoid duplicates
    for task in upcoming_tasks:
        # Check if we already notified about this task recently (within last hour)
        one_hour_ago = now - timedelta(hours=1)
        existing_notification = Notification.objects.filter(
            user=user,
            task=task,
            notification_type="task_reminder",
            title__contains="due",
            createdAt__gte=one_hour_ago
        ).exists()
        
        if not existing_notification:
            # Calculate time until deadline
            time_until = task.dueDate - now
            hours_remaining = int(time_until.total_seconds() / 3600)
            
            if hours_remaining <= 1:
                time_str = "in less than 1 hour"
            elif hours_remaining < 24:
                time_str = f"in {hours_remaining} hour{'s' if hours_remaining != 1 else ''}"
            else:
                time_str = "tomorrow"
            
            # Create notification
            notification = create_notification(
                user=user,
                notification_type="task_reminder",
                title=f"Task Due Soon ⏰",
                message=f"'{task.title}' is due {time_str}.",
                task=task
            )
            
            if notification:
                notifications_created += 1
    
    return notifications_created


# ✅ NEW: Helper to send push notifications to a user's subscriptions
def send_push_to_user(user, payload):
    """Send a Web Push notification payload to all subscriptions for a user."""
    print(f"[PUSH] Attempting to send push to {user.username}")
    print(f"[PUSH] Payload: {payload}")
    
    subscriptions = PushSubscription.objects.filter(user=user)
    print(f"[PUSH] Found {subscriptions.count()} subscription(s)")
    
    if not subscriptions.exists():
        print(f"[PUSH] No subscriptions found")
        return {
            "success": False,
            "message": "No push subscriptions found for this user.",
            "errors": []
        }

    vapid_private_key = getattr(settings, 'VAPID_PRIVATE_KEY', None)
    vapid_email = getattr(settings, 'VAPID_EMAIL', None)

    print(f"[PUSH] VAPID private key: {vapid_private_key[:20] if vapid_private_key else 'None'}...")
    print(f"[PUSH] VAPID email: {vapid_email}")

    if not vapid_private_key or not vapid_email:
        print(f"[PUSH] ERROR: VAPID configuration missing")
        return {
            "success": False,
            "message": "VAPID configuration missing."
        }

    vapid_claims = {
        "sub": vapid_email
    }

    payload_str = json.dumps(payload)
    errors = []
    success_count = 0

    for subscription in subscriptions:
        try:
            print(f"[PUSH] Sending to endpoint: {subscription.endpoint[:50]}...")
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
                vapid_claims=vapid_claims,
                ttl=60
            )
            success_count += 1
            print(f"[PUSH] Successfully sent to subscription {subscription.id}")
        except WebPushException as e:
            error_msg = str(e)
            print(f"[PUSH] WebPushException: {error_msg}")
            print(f"[PUSH] Full error details: {repr(e)}")
            errors.append(error_msg)
            # If subscription is expired/invalid, delete it
            if "410" in error_msg or "404" in error_msg:
                print(f"[PUSH] Deleting invalid subscription {subscription.id}")
                subscription.delete()
        except Exception as e:
            error_msg = str(e)
            print(f"[PUSH] Exception: {error_msg}")
            print(f"[PUSH] Full exception details: {repr(e)}")
            errors.append(error_msg)

    print(f"[PUSH] Sent to {success_count}/{subscriptions.count()} subscriptions")
    return {
        "success": success_count > 0,
        "sent_count": success_count,
        "errors": errors
    }


# ✅ NEW: Test notification endpoint
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_test_notification(request):
    """Send a test push notification to the current user (if subscribed)."""
    print(f"[TEST] Test notification request from {request.user.username}")
    
    try:
        payload = {
            "title": "Test Notification",
            "body": "This is a test push notification from LearnWork!",
            "url": "/",
            "test": True
        }

        result = send_push_to_user(request.user, payload)
        print(f"[TEST] Result: {result}")

        if result.get("success"):
            return Response({
                "success": True, 
                "message": f"Test notification sent to {result.get('sent_count', 0)} device(s)."
            })

        errors = result.get("errors")
        if not errors:
            return Response({
                "success": False, 
                "message": result.get("message", "No subscriptions found."), 
                "errors": []
            })

        return Response({
            "success": False, 
            "message": "Failed to send test notification.", 
            "errors": errors
        }, status=500)
    except Exception as e:
        print(f"[TEST] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"success": False, "message": f"Error: {str(e)}"}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_deadline_tasks(request):
    """
    ✅ Check for tasks due within 24 hours and create notifications
    Can be called by frontend to manually trigger deadline check
    or by a periodic task/Celery beat
    """
    try:
        count = check_and_notify_deadline_tasks(request.user)
        return Response({
            "success": True,
            "notifications_created": count,
            "message": f"Checked for upcoming deadlines. Created {count} notification(s)."
        })
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


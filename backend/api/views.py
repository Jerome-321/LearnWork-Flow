from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.shortcuts import redirect
import logging

logger = logging.getLogger(__name__)

from .models import Task, UserProgress, Notification, UserNotificationSettings, PushSubscription, WorkSchedule, CustomUser
from .serializers import TaskSerializer, NotificationSerializer, UserNotificationSettingsSerializer, WorkScheduleSerializer

from rest_framework.decorators import api_view, permission_classes
from .ai.ai_service import generate_schedule, generate_work_schedule_suggestion, groq_task_schedule_suggestion

# Push notification utilities
from pywebpush import webpush, WebPushException
import json

# TASK VIEWSET
from datetime import datetime

from rest_framework.permissions import AllowAny

from django.views.decorators.csrf import csrf_exempt

def format_time_12h(time_str):
    try:
        t = datetime.strptime(time_str, "%H:%M")
        return t.strftime("%I:%M %p").lstrip("0")
    except:
        return time_str

def create_notification(user, notification_type, title, message, task=None):
    """Helper function to create notifications"""
    Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        task=task
    )

# Custom admin logout view
def admin_logout(request):
    """Custom admin logout that redirects to React app"""
    from django.contrib.auth import logout
    logout(request)
    return redirect('/')
    
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by("-createdAt")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        conflict = False
        if serializer.validated_data.get('category') == 'work':
            conflict = self.check_schedule_conflict(serializer.validated_data)

        self.perform_create(serializer)

        task = serializer.instance
        create_notification(
            user=self.request.user,
            notification_type="task_reminder",
            title="New Task Created",
            message=f"'{task.title}' has been added to your tasks.",
            task=task
        )

        response_data = TaskSerializer(task).data
        if conflict:
            response_data['conflict'] = True
            response_data['message'] = 'Schedule conflict detected with academic tasks'

        headers = self.get_success_headers(response_data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


    def check_schedule_conflict(self, work_data):
        """Check if work schedule conflicts with academic tasks"""
        try:
            # Parse schedule data from description
            import json
            schedule_data = json.loads(work_data.get('description', '{}'))
            work_days = schedule_data.get('work_days', [])
            start_time = schedule_data.get('start_time')
            end_time = schedule_data.get('end_time')
            
            if not work_days or not start_time or not end_time:
                return False
            
            # Get all academic tasks for this user
            academic_tasks = Task.objects.filter(
                user=self.request.user,
                category='academic'
            )
            
            for academic_task in academic_tasks:
                academic_date = academic_task.dueDate
                if academic_date:
                    academic_day = academic_date.strftime('%A')  # Monday, Tuesday, etc.
                    academic_time = academic_date.strftime('%H:%M')
                    
                    if academic_day in work_days:
                        # Check time overlap
                        if start_time < academic_time < end_time:
                            return True
                            
        except (json.JSONDecodeError, AttributeError):
            pass
        
        return False

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
                title="Task Completed! ",
                message=f"You earned {task.points} points for completing '{task.title}'",
                task=task
            )
            
            # ✅ NEW: Create notification for pet level up if applicable
            old_level = created and 1 or max(1, (progress.totalPoints - task.points) // 100 + 1)
            if progress.petLevel > old_level:
                create_notification(
                    user=self.request.user,
                    notification_type="pet_update",
                    title="Your Pet Leveled Up!",
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

    @action(detail=False, methods=['post'])
    def schedule_suggestion(self, request):
        """
        Get AI-powered scheduling suggestions considering work schedules and priority
        """
        task_data = request.data
        user = request.user
        
        # Get user's work schedules
        work_schedules = list(WorkSchedule.objects.filter(user=user).values(
            'id', 'job_title', 'work_days', 'start_time', 'end_time', 'work_type'
        ))
        
        # Convert time objects to strings
        for schedule in work_schedules:
            if schedule.get('start_time'):
                schedule['start_time'] = schedule['start_time'].strftime('%H:%M')
            if schedule.get('end_time'):
                schedule['end_time'] = schedule['end_time'].strftime('%H:%M')
        
        # Get all user tasks for context
        all_tasks = list(Task.objects.filter(user=user).values(
            'id', 'title', 'dueDate', 'priority', 'category'
        ))
        
        # Convert datetime objects to ISO strings
        for task in all_tasks:
            if task.get('dueDate'):
                task['dueDate'] = task['dueDate'].isoformat()
        
        # Debug logging
        # print(f"DEBUG: task_data = {task_data}")
        # print(f"DEBUG: work_schedules = {work_schedules}")
        # print(f"DEBUG: all_tasks = {all_tasks}")
        
        # Generate scheduling suggestion
        try:
            suggestion = groq_task_schedule_suggestion(task_data, work_schedules, all_tasks)
            # print(f"DEBUG: suggestion result = {suggestion}")
            return Response(suggestion)
        except Exception as e:
            # print(f"DEBUG: Error in groq_task_schedule_suggestion: {e}")
            # import traceback
            # traceback.print_exc()
            return Response({"error": str(e)}, status=500)


class WorkScheduleViewSet(viewsets.ModelViewSet):
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkSchedule.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        work_schedule = serializer.save(user=self.request.user)
        # Mark that user has completed their schedule
        self.request.user.has_completed_schedule = True
        self.request.user.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['post'])
    def suggest(self, request):
        """
        Get AI-powered work schedule suggestions
        """
        work_schedule_data = request.data
        user = request.user
        
        # Get user's tasks for conflict detection
        tasks = Task.objects.filter(user=user).values(
            'title', 'dueDate', 'category'
        )
        
        from .ai.ai_service import generate_work_schedule_suggestion
        suggestion = generate_work_schedule_suggestion(work_schedule_data, list(tasks))
        
        return Response(suggestion)


# REGISTER


from api.utils import generate_otp, send_otp_email
from .models import EmailOTP
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny

@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def register(request):
    if request.method == 'OPTIONS':
        return Response(status=200)
    
    try:
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if not all([username, email, password]):
            return Response(
                {"error": "username, email, and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if "@" not in email or "." not in email:
            return Response(
                {"error": "Please provide a valid email address"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters long"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already exists
        existing_user = CustomUser.objects.filter(email=email).first()
        if existing_user:
            if existing_user.is_verified:
                return Response(
                    {"error": "Email already registered"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                user = existing_user
                user.username = username
                user.set_password(password)
                user.save()
        else:
            if CustomUser.objects.filter(username=username).exists():
                return Response(
                    {"error": "Username already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_verified=False
            )

        # Create UserProgress with defaults
        UserProgress.objects.get_or_create(
            user=user,
            defaults={
                'totalPoints': 0,
                'tasksCompleted': 0,
                'petLevel': 1,
                'petStage': 'egg',
                'currentStreak': 0,
                'longestStreak': 0,
            }
        )

        otp = generate_otp()
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()

        try:
            from .utils import send_otp_email
            send_otp_email(email, otp)
        except Exception as email_error:
            logger.warning(f"Failed to send OTP email to {email}: {email_error}")

        return Response({
            "message": "Account created successfully! Check your email for the OTP code.",
            "user": {
                "username": username,
                "email": email
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Register error: {str(e)}", exc_info=True)
        return Response(
            {"error": str(e)},
            status=500
        )
    

@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def verify_otp(request):
    # Handle preflight requests
    if request.method == 'OPTIONS':
        return Response(status=200)
    
    email = request.data.get("email")
    otp_input = request.data.get("otp")

    if not email or not otp_input:
        return Response(
            {"error": "Email and OTP are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = CustomUser.objects.get(email=email)

        # Check if OTP exists
        if not user.otp:
            return Response(
                {"error": "No OTP found. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if OTP is expired
        if user.is_otp_expired():
            return Response(
                {"error": "OTP expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify OTP
        if user.otp == otp_input:
            user.is_verified = True
            user.clear_otp()  # Clear OTP fields
            return Response(
                {"message": "Email verified successfully! You can now log in."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

    except CustomUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print("❌ VERIFY OTP ERROR:", str(e))
        return Response(
            {"error": "Verification failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def reset_password(request):
    """Send password reset email with OTP"""
    if request.method == 'OPTIONS':
        return Response(status=200)

    email = request.data.get("email")

    if not email:
        return Response(
            {"error": "Email is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = CustomUser.objects.get(email=email)

        # Generate OTP for password reset
        otp = generate_otp()
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()

        # Send password reset email
        try:
            from .utils import send_password_reset_email
            send_password_reset_email(email, otp)
            return Response(
                {"message": "Password reset code sent to your email."},
                status=status.HTTP_200_OK
            )
        except Exception as email_error:
            logger.warning(f"Failed to send reset email to {email}: {email_error}")
            return Response(
                {"error": "Failed to send email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except CustomUser.DoesNotExist:
        # Don't reveal if email exists or not for security
        return Response(
            {"message": "If that email exists, a reset code has been sent."},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        return Response(
            {"error": "Failed to process request"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def resend_otp(request):
    # Handle preflight requests
    if request.method == 'OPTIONS':
        return Response(status=200)

    email = request.data.get("email")

    if not email:
        return Response(
            {"error": "Email is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = CustomUser.objects.get(email=email)

        # Check rate limiting (60 seconds)
        if not user.can_resend_otp():
            return Response(
                {"error": "Please wait 60 seconds before requesting a new OTP"},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Generate new OTP
        otp = generate_otp()
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()

        # Send OTP email
        try:
            from .utils import send_otp_email
            send_otp_email(email, otp)
            print(f"✅ OTP resent to {email}")
            return Response(
                {"message": "OTP sent successfully. Check your email."},
                status=status.HTTP_200_OK
            )
        except Exception as email_error:
            print(f"⚠️ Email sending failed: {str(email_error)}")
            return Response(
                {"error": "Failed to send email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except CustomUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print("❌ RESEND OTP ERROR:", str(e))
        return Response(
            {"error": "Failed to resend OTP"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# LOGIN
@csrf_exempt
@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def login(request):
    """
    Login endpoint with OTP support for new users.
    Legacy users (without OTP records) can login without verification.
    Always returns JSON responses.
    """
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = Response(status=200)
        response["Access-Control-Allow-Origin"] = "https://learnwork-flow-production.up.railway.app"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    try:
        email = request.data.get("username")
        password = request.data.get("password")

        # Validate input
        if not email or not password:
            return Response(
                {"error": "username and password are required"},
                status=400
            )

        # Get user by email
        try:
            user_obj = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Invalid credentials"},
                status=401
            )

        # Authenticate with username and password
        user = authenticate(username=user_obj.username, password=password)

        if user is None:
            return Response(
                {"error": "Invalid credentials"},
                status=401
            )

        # Check if user is verified
        if not user.is_verified:
            return Response(
                {"error": "Account not verified. Please verify OTP first."},
                status=status.HTTP_403_FORBIDDEN
            )

        # New user with verified OTP - allow login
        # Auto-fix: if user has schedule records but flag is False, correct it
        if not user.has_completed_schedule and WorkSchedule.objects.filter(user=user).exists():
            user.has_completed_schedule = True
            user.save(update_fields=['has_completed_schedule'])

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser
            },
            "has_completed_schedule": user.has_completed_schedule
        }, status=200)

    except Exception as e:
        # Catch all unexpected errors and return JSON
        import traceback
        print("❌ LOGIN ERROR:", str(e))
        print(traceback.format_exc())
        return Response(
            {"error": "An error occurred during login. Please try again."},
            status=500
        )



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
    task_id = request.data.get("id")

    # Validate required fields
    if not title:
        return Response({"error": "title is required"}, status=400)
    if not category:
        return Response({"error": "category is required"}, status=400)
    if not dueDate:
        return Response({"error": "dueDate is required for AI analysis"}, status=400)

    # Get user's existing tasks for context (exclude current task if editing)
    tasks_query = Task.objects.filter(
        user=request.user,
        completed=False
    )
    if task_id:
        tasks_query = tasks_query.exclude(id=task_id)

    all_tasks = []
    for task in tasks_query:
        all_tasks.append({
            "id": task.id,
            "title": task.title,
            "dueDate": task.dueDate.isoformat() if hasattr(task.dueDate, 'isoformat') else str(task.dueDate),
            "priority": task.priority,
            "estimatedDuration": task.estimatedDuration or 60,
            "completed": task.completed
        })

    # Get user's work schedules
    work_schedules = WorkSchedule.objects.filter(user=request.user)
    schedules_data = []
    for schedule in work_schedules:
        schedules_data.append({
            "id": schedule.id,
            "job_title": schedule.job_title,
            "start_time": schedule.start_time.strftime("%H:%M") if schedule.start_time else "09:00",
            "end_time": schedule.end_time.strftime("%H:%M") if schedule.end_time else "17:00",
            "work_days": schedule.work_days or []
        })

    # Build task data
    task_data = {
        "id": task_id,
        "title": title,
        "description": description,
        "category": category,
        "priority": priority or "medium",
        "dueDate": dueDate,
        "estimatedDuration": estimatedDuration or 60
    }

    # Call new 3-step analysis function
    try:
        from .ai.groq_ai import groq_task_schedule_suggestion
        
        # DEBUG: Log what we're sending
        print(f"[DEBUG AI] Task: {task_data}")
        print(f"[DEBUG AI] Existing tasks count: {len(all_tasks)}")
        for t in all_tasks:
            print(f"  - {t['title']} at {t['dueDate']}")
        print(f"[DEBUG AI] Work schedules count: {len(schedules_data)}")
        for s in schedules_data:
            print(f"  - {s['job_title']}: {s['work_days']}")
        
        result = groq_task_schedule_suggestion(task_data, schedules_data, all_tasks)
        print(f"[DEBUG AI] Result: {result}")
        
        # Also include existing tasks for context in the response
        result['existing_tasks'] = [
            {
                'title': t['title'],
                'priority': t['priority'],
                'dueDate': t['dueDate']
            } for t in all_tasks
        ]
        
        return Response(result, status=200)

    except Exception as e:
        # Log error for debugging and return graceful fallback
        print(f"AI analyze failure: {e}")
        return Response({
            "type": "suggestion",
            "analysis_step": "No Conflicts - Optimal Time Suggestion",
            "suggested_time": "18:00",
            "priority": priority or "medium",
            "reason": "AI service unavailable; using default scheduling.",
            "estimated_duration": "1–2 hours",
            "work_schedules": schedules_data,
            "existing_tasks": [
                {
                    'title': t['title'],
                    'priority': t['priority'],
                    'dueDate': t['dueDate']
                } for t in all_tasks
            ]
        }, status=200)


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
    print(f"[VAPID] Sending public key: {public_key[:50] if public_key else 'None'}...")
    return Response({"public_key": public_key})


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

    # Send email notification
    if user.email:
        from .utils import send_notification_email
        send_notification_email(user.email, title, message)

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
                title=f"Task Due Soon ",
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
        }, status=200)
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


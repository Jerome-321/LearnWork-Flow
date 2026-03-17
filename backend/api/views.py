from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone

from .models import Task, UserProgress
from .serializers import TaskSerializer

from rest_framework.decorators import api_view, permission_classes
from .ai.ai_service import generate_schedule

# TASK VIEWSET
from datetime import datetime

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
        serializer.save(user=self.request.user)

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


@api_view(['POST'])
def register(request):

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
def progress(request):

    progress, created = UserProgress.objects.get_or_create(
        user=request.user
    )

    return Response({
        "totalPoints": progress.totalPoints,
        "tasksCompleted": progress.tasksCompleted,
        "petLevel": progress.petLevel,
        "petStage": progress.petStage
    })

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


from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse

from api.views import (
    TaskViewSet, 
    login, 
    register,
    progress,
    leaderboard,
    ai_analyze_task,
    get_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    get_notification_settings,
    get_vapid_public_key,
    subscribe_push,
    unsubscribe_push,
    check_deadline_tasks,
    send_test_notification
)

# Router
router = DefaultRouter()
router.register(r'tasks', TaskViewSet)

# ✅ Health check (SAFE)
def health_check(request):
    return JsonResponse({"status": "ok"})

# ✅ Home route
def home(request):
    return JsonResponse({
        "status": "ok",
        "message": "LearnWork API is running 🚀"
    })

urlpatterns = [
    # 🔥 Put health check FIRST
    path('healthz', health_check),

    # Home
    path('', home),

    # Admin
    path('admin/', admin.site.urls),

    # API (router)
    path('api/', include(router.urls)),

    # API custom endpoints
    path('api/login/', login),
    path('api/register/', register),
    path('api/progress/', progress),
    path('api/leaderboard/', leaderboard),
    path("api/ai/analyze/", ai_analyze_task),

    # Notifications
    path("api/notifications/", get_notifications),
    path("api/notifications/mark-read/", mark_notification_read),
    path("api/notifications/mark-all-read/", mark_all_notifications_read),
    path("api/notifications/settings/", get_notification_settings),
    path("api/notifications/vapid-public-key/", get_vapid_public_key),
    path("api/notifications/subscribe/", subscribe_push),
    path("api/notifications/unsubscribe/", unsubscribe_push),
    path("api/notifications/check-deadlines/", check_deadline_tasks),
    path("api/notifications/send-test/", send_test_notification),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
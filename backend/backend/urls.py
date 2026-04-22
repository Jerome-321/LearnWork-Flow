from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.shortcuts import render
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse

from api.views import (
    TaskViewSet,
    WorkScheduleViewSet,
    login,
    register,
    verify_otp,
    resend_otp,
    reset_password,
    progress,
    leaderboard,
    ai_analyze_task,
    optimize_schedule,
    get_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    get_notification_settings,
    get_vapid_public_key,
    subscribe_push,
    unsubscribe_push,
    check_deadline_tasks,
    send_test_notification,
    admin_logout,
    get_streak,
    update_streak
)

# Router
router = DefaultRouter()
router.register(r'tasks', TaskViewSet)
router.register(r'work-schedules', WorkScheduleViewSet)

# ✅ Health check (SAFE)
def health_check(request):
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Health check called")
    return JsonResponse({"status": "ok"})

# ✅ Frontend SPA fallback route
def frontend(request, path=None):
    return render(request, 'index.html')

urlpatterns = [
    # 🔥 Put health check FIRST
    path('healthz', health_check),

    # API endpoints

    # Custom admin logout (must come before admin.site.urls)
    path('admin/logout/', admin_logout),

    # Admin
    path('admin/', admin.site.urls),

    # API (router)
    path('api/', include(router.urls)),

    # API custom endpoints
    path('api/login/', login),
    path('api/register/', register),
    path('api/verify-otp/', verify_otp),
    path('api/resend-otp/', resend_otp),
    path('api/reset-password/', reset_password),
    path('api/progress/', progress),
    path('api/leaderboard/', leaderboard),
    path("api/ai/analyze/", ai_analyze_task),
    path("api/ai/optimize-schedule/", optimize_schedule),

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

    # Streak
    path("api/streak/", get_streak),
    path("api/streak/update/", update_streak),
] + staticfiles_urlpatterns() + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve frontend index.html for all non-API routes
urlpatterns += [
    re_path(r'^.*$', frontend),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
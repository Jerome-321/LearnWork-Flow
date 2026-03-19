from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
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
    update_notification_settings,
    check_deadline_tasks
)


router = DefaultRouter()
router.register(r'tasks', TaskViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include(router.urls)),

    path('api/login/', login),
    path('api/register/', register),
    path('api/progress/', progress),
    path('api/leaderboard/', leaderboard),
    path("api/ai/analyze/", ai_analyze_task),
    
    # ✅ Notification endpoints
    path("api/notifications/", get_notifications),
    path("api/notifications/mark-read/", mark_notification_read),
    path("api/notifications/mark-all-read/", mark_all_notifications_read),
    path("api/notification-settings/", get_notification_settings),
    path("api/notification-settings/update/", update_notification_settings),
    
    # ✅ NEW: Deadline checking endpoint
    path("api/notifications/check-deadlines/", check_deadline_tasks),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
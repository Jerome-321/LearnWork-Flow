from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    TaskViewSet, 
    login, 
    register,
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
    path("api/ai/analyze/", ai_analyze_task),
    
    # ✅ Notification endpoints
    path("api/notifications/", get_notifications),
    path("api/notifications/mark-read/", mark_notification_read),
    path("api/notifications/mark-all-read/", mark_all_notifications_read),
    path("api/notification-settings/", get_notification_settings),
    path("api/notification-settings/update/", update_notification_settings),
    
    # ✅ NEW: Deadline checking endpoint
    path("api/notifications/check-deadlines/", check_deadline_tasks),
]
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import TaskViewSet, login, register
from api.views import ai_analyze_task


router = DefaultRouter()
router.register(r'tasks', TaskViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include(router.urls)),

    path('api/login/', login),
    path('api/register/', register),
    path("api/ai/analyze/", ai_analyze_task)
]
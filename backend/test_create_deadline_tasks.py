"""
Quick test script to create tasks with upcoming deadlines for testing notifications.
Run: python test_create_deadline_tasks.py
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from api.models import Task
from django.contrib.auth.models import User

print("=" * 60)
print("CREATE TEST TASKS WITH UPCOMING DEADLINES")
print("=" * 60)

# Get user
try:
    user = User.objects.get(username='demo')
    print(f"\nUsing user: {user.username}")
except User.DoesNotExist:
    print("\nError: User 'demo' not found. Please create a user first.")
    sys.exit(1)

now = timezone.now()

# Create test tasks
test_tasks = [
    {
        'title': 'Test: Due in 5 minutes',
        'dueDate': now + timedelta(minutes=5),
        'description': 'This should trigger a 5-minute notification',
    },
    {
        'title': 'Test: Due in 1 hour',
        'dueDate': now + timedelta(hours=1),
        'description': 'This should trigger a 1-hour notification',
    },
    {
        'title': 'Test: Due in 5 hours',
        'dueDate': now + timedelta(hours=5),
        'description': 'This should trigger a 5-hour notification',
    },
    {
        'title': 'Test: Due in 1 day',
        'dueDate': now + timedelta(days=1),
        'description': 'This should trigger a 1-day notification',
    },
]

print("\nCreating test tasks...")
for task_data in test_tasks:
    task = Task.objects.create(
        user=user,
        title=task_data['title'],
        description=task_data['description'],
        category='test',
        priority='high',
        dueDate=task_data['dueDate'],
        points=10
    )
    print(f"  [OK] Created: {task.title}")
    print(f"       Due: {task.dueDate}")

print("\n" + "=" * 60)
print("TEST TASKS CREATED SUCCESSFULLY")
print("=" * 60)
print("\nNext steps:")
print("1. Run: python manage.py check_deadlines")
print("2. You should see notifications being sent")
print("3. Check your browser for push notifications")
print("\nTo clean up test tasks:")
print("  Task.objects.filter(category='test').delete()")
print("=" * 60)

#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser, UserProgress

print("=== Database Check ===")
print(f"CustomUsers: {CustomUser.objects.count()}")
for u in CustomUser.objects.all():
    print(f"  - {u.username} (id={u.id}, is_verified={u.is_verified})")

print(f"\nUserProgress: {UserProgress.objects.count()}")
for up in UserProgress.objects.all():
    print(f"  - {up.user.username} (user_id={up.user_id})")

print("\n=== Testing Registration ===")
try:
    user = CustomUser.objects.create_user(
        username='testuser999',
        email='testuser999@test.com',
        password='testpass123',
        is_verified=False
    )
    print(f"✓ User created: {user.username} (id={user.id})")
    
    up, created = UserProgress.objects.get_or_create(user=user)
    print(f"✓ UserProgress {'created' if created else 'retrieved'}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

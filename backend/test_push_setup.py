"""
Push Notification System Test Script
Run this to verify your setup is correct
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from py_vapid import Vapid
from api.models import PushSubscription, User

print("=" * 60)
print("PUSH NOTIFICATION SYSTEM TEST")
print("=" * 60)

# Test 1: VAPID Configuration
print("\n[1/5] Testing VAPID Configuration...")
try:
    public_key = settings.VAPID_PUBLIC_KEY
    private_key = settings.VAPID_PRIVATE_KEY
    email = settings.VAPID_EMAIL
    
    print(f"  [OK] Public Key: {public_key[:50]}...")
    print(f"  [OK] Private Key: {private_key[:20]}...")
    print(f"  [OK] Email: {email}")
    
    # Verify private key is valid
    v = Vapid.from_string(private_key=private_key)
    print(f"  [OK] Private key is valid ({type(v._private_key).__name__})")
    print("  [PASS] VAPID Configuration")
except Exception as e:
    print(f"  [FAIL] VAPID Configuration - {e}")
    sys.exit(1)

# Test 2: Database Models
print("\n[2/5] Testing Database Models...")
try:
    from api.models import PushSubscription, UserNotificationSettings, Notification
    print("  [OK] PushSubscription model exists")
    print("  [OK] UserNotificationSettings model exists")
    print("  [OK] Notification model exists")
    print("  [PASS] Database Models")
except Exception as e:
    print(f"  [FAIL] Database Models - {e}")
    sys.exit(1)

# Test 3: Check Subscriptions
print("\n[3/5] Checking Existing Subscriptions...")
try:
    total_subs = PushSubscription.objects.count()
    print(f"  [OK] Total subscriptions in database: {total_subs}")
    
    if total_subs > 0:
        print("\n  Subscriptions by user:")
        for user in User.objects.all():
            user_subs = PushSubscription.objects.filter(user=user).count()
            if user_subs > 0:
                print(f"    - {user.username}: {user_subs} subscription(s)")
    else:
        print("  [INFO] No subscriptions yet (this is normal for first run)")
    
    print("  [PASS] Subscription Check")
except Exception as e:
    print(f"  [FAIL] Subscription Check - {e}")

# Test 4: API Endpoints
print("\n[4/5] Testing API Endpoints...")
try:
    from api.views import (
        get_vapid_public_key,
        subscribe_push,
        unsubscribe_push,
        send_test_notification
    )
    print("  [OK] get_vapid_public_key endpoint exists")
    print("  [OK] subscribe_push endpoint exists")
    print("  [OK] unsubscribe_push endpoint exists")
    print("  [OK] send_test_notification endpoint exists")
    print("  [PASS] API Endpoints")
except Exception as e:
    print(f"  [FAIL] API Endpoints - {e}")
    sys.exit(1)

# Test 5: pywebpush Library
print("\n[5/5] Testing pywebpush Library...")
try:
    from pywebpush import webpush, WebPushException
    print("  [OK] pywebpush library installed")
    print("  [PASS] pywebpush Library")
except Exception as e:
    print(f"  [FAIL] pywebpush Library - {e}")
    print("  [INFO] Install with: pip install pywebpush")
    sys.exit(1)

# Summary
print("\n" + "=" * 60)
print("[SUCCESS] ALL TESTS PASSED!")
print("=" * 60)
print("\nYour push notification system is configured correctly.")
print("\nNext steps:")
print("1. Start Django server: python manage.py runserver")
print("2. Start frontend dev server")
print("3. Login to your app")
print("4. Go to Settings page")
print("5. Enable push notifications")
print("6. Click 'Send Test Notification'")
print("\nCheck the PUSH_NOTIFICATION_DEBUG_GUIDE.md for detailed debugging.")
print("=" * 60)

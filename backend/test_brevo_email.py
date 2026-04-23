"""
Test Brevo Email Sending
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.utils import send_otp_email, send_password_reset_email, send_notification_email

def test_otp_email():
    print("\n" + "="*60)
    print("Testing OTP Email to jeeromee7@gmail.com")
    print("="*60)
    
    test_otp = "123456"
    email = "jeeromee7@gmail.com"
    
    try:
        send_otp_email(email, test_otp)
        print(f"[OK] OTP email sent successfully!")
        print(f"   Email: {email}")
        print(f"   OTP: {test_otp}")
        print(f"   Check your inbox (and spam folder)")
        return True
    except Exception as e:
        print(f"[FAIL] Failed to send OTP email: {e}")
        return False

def test_password_reset_email():
    print("\n" + "="*60)
    print("Testing Password Reset Email to jeeromee7@gmail.com")
    print("="*60)
    
    test_otp = "654321"
    email = "jeeromee7@gmail.com"
    
    try:
        send_password_reset_email(email, test_otp)
        print(f"[OK] Password reset email sent successfully!")
        print(f"   Email: {email}")
        print(f"   OTP: {test_otp}")
        print(f"   Check your inbox (and spam folder)")
        return True
    except Exception as e:
        print(f"[FAIL] Failed to send password reset email: {e}")
        return False

def test_notification_email():
    print("\n" + "="*60)
    print("Testing Notification Email to jeeromee7@gmail.com")
    print("="*60)
    
    email = "jeeromee7@gmail.com"
    title = "Test Notification"
    message = "This is a test notification from LearnWork-Flow to verify Brevo API integration."
    
    try:
        send_notification_email(email, title, message)
        print(f"[OK] Notification email sent successfully!")
        print(f"   Email: {email}")
        print(f"   Title: {title}")
        print(f"   Check your inbox (and spam folder)")
        return True
    except Exception as e:
        print(f"[FAIL] Failed to send notification email: {e}")
        return False

if __name__ == "__main__":
    print("\nStarting Brevo Email Tests...")
    print(f"API Key: {os.getenv('SENDINBLUE_API_KEY', 'NOT SET')[:20]}...")
    
    # Wait a bit for async emails
    import time
    
    results = []
    
    # Test 1: OTP Email
    results.append(("OTP Email", test_otp_email()))
    time.sleep(2)
    
    # Test 2: Password Reset Email
    results.append(("Password Reset Email", test_password_reset_email()))
    time.sleep(2)
    
    # Test 3: Notification Email
    results.append(("Notification Email", test_notification_email()))
    time.sleep(2)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test_name, success in results:
        status = "[OK] PASSED" if success else "[FAIL] FAILED"
        print(f"{test_name}: {status}")
    
    print("\nCheck jeeromee7@gmail.com inbox (and spam folder)")
    print("="*60)

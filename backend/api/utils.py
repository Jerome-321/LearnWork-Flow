import random

def generate_otp():
    return str(random.randint(100000, 999999))

import random
from django.core.mail import EmailMultiAlternatives

def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp_email(email, otp):
    import threading
    threading.Thread(target=_send_otp_email, args=(email, otp), daemon=True).start()

def _send_otp_email(email, otp):
    import os, requests
    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        print('❌ RESEND_API_KEY not set')
        return
    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f8fa; padding:40px;">
        <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:10px;text-align:center;">
            <img src="https://raw.githubusercontent.com/Jerome-321/LearnWork-Flow/main/logo.png" width="80" style="margin-bottom:20px;" />
            <h2>LearnWork-Flow</h2>
            <p>Please verify your identity</p>
            <div style="font-size:32px;letter-spacing:6px;margin:20px 0;font-weight:bold;">{otp}</div>
            <p>This code is valid for 5 minutes.</p>
            <p>Please don't share this code with anyone.</p>
            <p>Thanks,<br>The LearnWork-Flow Team</p>
        </div>
    </div>
    """
    response = requests.post(
        'https://api.resend.com/emails',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        json={
            'from': 'LearnWork-Flow <onboarding@resend.dev>',
            'to': [email],
            'subject': 'Verify your identity',
            'html': html_content
        },
        timeout=10
    )
    print(f'[RESEND] Status: {response.status_code}, Body: {response.text}')

def _send_email_via_resend(to, subject, html_content):
    import os, requests
    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        print('❌ RESEND_API_KEY not set')
        return
    response = requests.post(
        'https://api.resend.com/emails',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        json={
            'from': 'LearnWork-Flow <onboarding@resend.dev>',
            'to': [to],
            'subject': subject,
            'html': html_content
        },
        timeout=10
    )
    print(f'[RESEND] Status: {response.status_code}, Body: {response.text}')


def send_task_email(user_email, task_title, time_left, task_id=None):
    import threading
    threading.Thread(target=_send_task_email, args=(user_email, task_title, time_left, task_id), daemon=True).start()

def _send_task_email(user_email, task_title, time_left, task_id=None):
    BASE_URL = "https://learnwork-flow-1.onrender.com"
    task_url = f"{BASE_URL}/tasks/{task_id}" if task_id else f"{BASE_URL}/tasks"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f8fa; padding:40px;">
        <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:10px;text-align:center;">
            <h2 style="margin:0;">LearnWork-Flow</h2>
            <p style="color:#57606a;">Task Reminder</p>
            <div style="font-size:22px;margin:20px 0;font-weight:bold;">{task_title}</div>
            <div style="font-size:18px;color:#d1242f;margin-bottom:20px;">Due in {time_left}</div>
            <a href="{task_url}" style="display:inline-block;padding:12px 20px;background:#2da44e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">View Task</a>
            <p style="margin-top:20px;color:#57606a;">Don't forget to complete your task!</p>
            <p style="font-size:12px;color:#8c959f;">Stay productive 🚀</p>
        </div>
    </div>
    """
    _send_email_via_resend(user_email, "Task Reminder ⏰", html_content)


def send_notification_email(user_email, title, message):
    import threading
    threading.Thread(target=_send_notification_email, args=(user_email, title, message), daemon=True).start()

def _send_notification_email(user_email, title, message):
    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f8fa; padding:40px;">
        <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:10px;text-align:center;">
            <h2 style="margin:0;">LearnWork-Flow</h2>
            <div style="font-size:20px;margin:20px 0;font-weight:bold;">{title}</div>
            <p style="color:#57606a;font-size:16px;">{message}</p>
            <a href="https://learnwork-flow-1.onrender.com" style="display:inline-block;padding:12px 20px;background:#2da44e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:10px;">Open App</a>
            <p style="font-size:12px;color:#8c959f;margin-top:20px;">Stay productive 🚀</p>
        </div>
    </div>
    """
    _send_email_via_resend(user_email, title, html_content)
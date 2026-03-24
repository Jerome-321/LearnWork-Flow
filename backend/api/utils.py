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
    api_key = os.environ.get('SENDGRID_API_KEY')
    if api_key:
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
        requests.post(
            'https://api.sendgrid.com/v3/mail/send',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={
                'personalizations': [{'to': [{'email': email}]}],
                'from': {'email': os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@learnwork-flow.com'), 'name': 'LearnWork-Flow'},
                'subject': 'Verify your identity',
                'content': [{'type': 'text/html', 'value': html_content}]
            },
            timeout=10
        )
        return
    # fallback to SMTP if no SendGrid key
    subject = "Verify your identity"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f8fa; padding:40px;">
        <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:10px;text-align:center;">
            
            <img src="https://raw.githubusercontent.com/Jerome-321/LearnWork-Flow/main/logo.png" width="80" style="margin-bottom:20px;" />

            <h2>LearnWork-Flow</h2>
            <p>Please verify your identity</p>

            <div style="font-size:32px;letter-spacing:6px;margin:20px 0;font-weight:bold;">
                {otp}
            </div>

            <p>This code is valid for 5 minutes.</p>

            <p>Please don't share this code with anyone: we'll never ask for it on the phone or via email.</p>
            <p>Thanks,
            <br>The LearnWork-Flow Team</p>
        </div>
    </div>
    """

    email_msg = EmailMultiAlternatives(
        subject,
        f"Your OTP is {otp}",
        None,
        [email],
    )

    email_msg.attach_alternative(html_content, "text/html")
    email_msg.send()

from django.core.mail import EmailMultiAlternatives

def send_task_email(user_email, task_title, time_left, task_id=None):
    import threading
    threading.Thread(target=_send_task_email, args=(user_email, task_title, time_left, task_id), daemon=True).start()

def _send_task_email(user_email, task_title, time_left, task_id=None):

    # 🔗 your frontend URL (CHANGE THIS)
    BASE_URL = "https://learnwork-flow-1.onrender.com/dashboard"

    # build link
    if task_id:
        task_url = f"{BASE_URL}/tasks/{task_id}"
    else:
        task_url = f"{BASE_URL}/tasks"

    subject = "Task Reminder ⏰"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f8fa; padding:40px;">
        <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:10px;text-align:center;">
            
            <h2 style="margin:0;">LearnWork-Flow</h2>
            <p style="color:#57606a;">Task Reminder</p>

            <div style="font-size:22px;margin:20px 0;font-weight:bold;">
                {task_title}
            </div>

            <div style="font-size:18px;color:#d1242f;margin-bottom:20px;">
                Due in {time_left}
            </div>

            <!-- 🔥 BUTTON -->
            <a href="{task_url}" 
               style="
                   display:inline-block;
                   padding:12px 20px;
                   background:#2da44e;
                   color:white;
                   text-decoration:none;
                   border-radius:6px;
                   font-weight:bold;
                   margin-top:10px;
               ">
               View Task
            </a>

            <p style="margin-top:20px;color:#57606a;">
                Don't forget to complete your task!
            </p>

            <hr style="margin:20px 0;">

            <p style="font-size:12px;color:#8c959f;">
                Stay productive 🚀
            </p>

        </div>
    </div>
    """

    email_msg = EmailMultiAlternatives(
        subject,
        f"Reminder: {task_title} due in {time_left}",
        None,
        [user_email],
    )

    email_msg.attach_alternative(html_content, "text/html")
    email_msg.send()
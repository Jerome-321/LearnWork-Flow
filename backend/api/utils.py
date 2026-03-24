import random
from django.core.mail import EmailMultiAlternatives


def generate_otp():
    return str(random.randint(100000, 999999))


def _base_email(content_html):
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
        <tr><td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

            <!-- Header -->
            <tr>
              <td style="background:#000000;padding:28px 32px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:white;border-radius:8px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                      <span style="font-size:20px;line-height:40px;">✓</span>
                    </td>
                    <td style="padding-left:12px;">
                      <span style="color:white;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">LearnWork-Flow</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                {content_html}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e4e4e7;text-align:center;">
                <p style="margin:0;font-size:12px;color:#a1a1aa;">Productivity for working students &mdash; LearnWork-Flow</p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


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


# OTP EMAIL

def send_otp_email(email, otp):
    import threading
    threading.Thread(target=_send_otp_email, args=(email, otp), daemon=True).start()

def _send_otp_email(email, otp):
    content = f"""
        <h2 style="margin:0 0 8px;font-size:22px;color:#09090b;">Verify your email</h2>
        <p style="margin:0 0 24px;color:#71717a;font-size:15px;">Enter this code to complete your registration.</p>

        <div style="background:#f4f4f5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#09090b;">{otp}</span>
        </div>

        <p style="margin:0 0 8px;color:#71717a;font-size:13px;text-align:center;">This code expires in <strong>5 minutes</strong>.</p>
        <p style="margin:0;color:#71717a;font-size:13px;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
    """
    _send_email_via_resend(email, 'Verify your LearnWork-Flow account', _base_email(content))


# TASK REMINDER EMAIL

def send_task_email(user_email, task_title, time_left, task_id=None):
    import threading
    threading.Thread(target=_send_task_email, args=(user_email, task_title, time_left, task_id), daemon=True).start()

def _send_task_email(user_email, task_title, time_left, task_id=None):
    BASE_URL = "https://learnwork-flow-1.onrender.com"
    task_url = f"{BASE_URL}/tasks/{task_id}" if task_id else BASE_URL

    content = f"""
        <h2 style="margin:0 0 8px;font-size:22px;color:#09090b;">Task Due Soon ⏰</h2>
        <p style="margin:0 0 24px;color:#71717a;font-size:15px;">You have a task coming up.</p>

        <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:bold;color:#09090b;">{task_title}</p>
          <p style="margin:0;font-size:14px;color:#ef4444;">Due in {time_left}</p>
        </div>

        <a href="{task_url}" style="display:block;text-align:center;background:#09090b;color:white;text-decoration:none;padding:12px;border-radius:8px;font-weight:bold;font-size:15px;">View Task</a>
        <p style="margin:16px 0 0;color:#71717a;font-size:13px;text-align:center;">Stay on top of your tasks and keep the streak going 🚀</p>
    """
    _send_email_via_resend(user_email, f'Task Reminder: {task_title}', _base_email(content))


# NOTIFICATION EMAIL

def send_notification_email(user_email, title, message):
    import threading
    threading.Thread(target=_send_notification_email, args=(user_email, title, message), daemon=True).start()

def _send_notification_email(user_email, title, message):
    content = f"""
        <h2 style="margin:0 0 8px;font-size:22px;color:#09090b;">{title}</h2>
        <p style="margin:0 0 24px;color:#71717a;font-size:15px;">{message}</p>

        <a href="https://learnwork-flow-1.onrender.com" style="display:block;text-align:center;background:#09090b;color:white;text-decoration:none;padding:12px;border-radius:8px;font-weight:bold;font-size:15px;">Open LearnWork-Flow</a>
        <p style="margin:16px 0 0;color:#71717a;font-size:13px;text-align:center;">Stay productive 🚀</p>
    """
    _send_email_via_resend(user_email, title, _base_email(content))

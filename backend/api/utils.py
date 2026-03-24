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
              <td style="background:#000000;padding:24px 32px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="https://learnwork-flow-1.onrender.com/media/logo.png" alt="LearnWork-Flow" style="width:48px;height:48px;border-radius:8px;object-fit:cover;" />
                    </td>
                    <td style="padding-left:12px;vertical-align:middle;">
                      <div style="color:white;font-size:20px;font-weight:bold;letter-spacing:-0.5px;line-height:1.1;">LearnWork-Flow</div>
                      <div style="color:#d4d4d8;font-size:12px;letter-spacing:0.5px;">Productivity for working students</div>
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
        <h2 style="margin:0 0 8px;font-size:22px;color:#09090b;">Verify your LearnWork-Flow account</h2>
        <p style="margin:0 0 16px;color:#52525b;font-size:15px;">Welcome! We received a request to sign in with your email address.</p>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Use the one-time code below to verify your account. If this wasn't you, please ignore this email.</p>

        <div style="background:#f4f4f5;border-radius:10px;padding:24px;text-align:center;margin-bottom:20px;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#111827;">{otp}</span>
        </div>

        <p style="margin:0 0 8px;color:#71717a;font-size:13px;text-align:center;"><strong>Valid for 5 minutes</strong>. Don't share this code with anyone.</p>
        <p style="margin:0 0 16px;color:#71717a;font-size:13px;text-align:center;">Need help? Reply to this email and we'll assist you quickly.</p>
        <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">LearnWork-Flow helps you hit milestones with organized tasks and reminders.</p>
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
        <p style="margin:0 0 16px;color:#52525b;font-size:15px;">You’re one step away from completing a goal.</p>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Keep momentum by checking this task and marking it done.</p>

        <div style="background:#f4f4f5;border-radius:10px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#111827;">{task_title}</p>
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

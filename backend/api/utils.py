import random
from django.core.mail import EmailMultiAlternatives, send_mail


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
              <td style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #e4e4e7;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="data:image/png;base64,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" alt="LearnWork-Flow" style="width:48px;height:48px;border-radius:8px;object-fit:cover;" />
                    </td>
                    <td style="padding-left:12px;vertical-align:middle;">
                      <div style="color:#09090b;font-size:20px;font-weight:bold;letter-spacing:-0.5px;line-height:1.1;">LearnWork-Flow</div>
                      <div style="color:#6b7280;font-size:12px;letter-spacing:0.5px;">Productivity for working students</div>
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


def _send_email_via_brevo(to, subject, html_content):
    import os, requests
    api_key = os.environ.get('BREVO_API_KEY')
    if not api_key:
        print('❌ BREVO_API_KEY not set')
        return
    response = requests.post(
        'https://api.brevo.com/v3/smtp/email',
        headers={'api-key': api_key, 'Content-Type': 'application/json'},
        json={
            'sender': {'name': 'LearnWork-Flow', 'email': os.environ.get('EMAIL_USER', 'jerome.natividad7704@gmail.com')},
            'to': [{'email': to}],
            'subject': subject,
            'htmlContent': html_content
        },
        timeout=10
    )
    print(f'[BREVO] Status: {response.status_code}, Body: {response.text}')


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
    _send_email_via_brevo(email, 'Verify your LearnWork-Flow account', _base_email(content))
    print(f"✅ OTP email sent to {email} via Brevo")


# TASK REMINDER EMAIL

def send_task_email(user_email, task_title, time_left, task_id=None):
    import threading
    threading.Thread(target=_send_task_email, args=(user_email, task_title, time_left, task_id), daemon=True).start()

def _send_task_email(user_email, task_title, time_left, task_id=None):
    BASE_URL = "https://learnwork-flow-1.onrender.com"
    task_url = f"{BASE_URL}/tasks/{task_id}" if task_id else BASE_URL

    content = f"""
        <h2 style="margin:0 0 8px;font-size:22px;color:#09090b;">Task Due Soon </h2>
        <p style="margin:0 0 16px;color:#52525b;font-size:15px;">You’re one step away from completing a goal.</p>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Keep momentum by checking this task and marking it done.</p>

        <div style="background:#f4f4f5;border-radius:10px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#111827;">{task_title}</p>
          <p style="margin:0;font-size:14px;color:#ef4444;">Due in {time_left}</p>
        </div>

        <a href="{task_url}" style="display:block;text-align:center;background:#09090b;color:white;text-decoration:none;padding:12px;border-radius:8px;font-weight:bold;font-size:15px;">View Task</a>
        <p style="margin:16px 0 0;color:#71717a;font-size:13px;text-align:center;">Stay on top of your tasks and keep the streak going 🚀</p>
    """

    subject = f'Task Reminder: {task_title}'
    _send_email_via_brevo(user_email, subject, _base_email(content))
    print(f"✅ Task reminder email sent to {user_email} via Brevo")


# NOTIFICATION EMAIL

def send_notification_email(user_email, title, message):
    import threading
    threading.Thread(target=_send_notification_email, args=(user_email, title, message), daemon=True).start()

def _send_notification_email(user_email, title, message):
    content = f"""
        <h2 style="margin:0 0 8px;font-size:22px;color:#09090b;">{title}</h2>
        <p style="margin:0 0 24px;color:#71717a;font-size:15px;">{message}</p>

        <a href="https://learnwork-flow-1.onrender.com" style="display:block;text-align:center;background:#09090b;color:white;text-decoration:none;padding:12px;border-radius:8px;font-weight:bold;font-size:15px;">Open LearnWork-Flow</a>
        <p style="margin:16px 0 0;color:#71717a;font-size:13px;text-align:center;">Stay productive </p>
    """
    _send_email_via_brevo(user_email, title, _base_email(content))
    print(f"✅ Notification email sent to {user_email} via Brevo")


# PASSWORD RESET EMAIL

def send_password_reset_email(email, otp):
    import threading
    threading.Thread(target=_send_password_reset_email, args=(email, otp), daemon=True).start()

def _send_password_reset_email(email, otp):
    content = f"""
        <h2 style="margin:0 0 8px;font-size:22px;color:#09090b;">Reset your password</h2>
        <p style="margin:0 0 16px;color:#52525b;font-size:15px;">We received a request to reset your password.</p>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Use the one-time code below to reset your password. If you didn't request this, please ignore this email.</p>

        <div style="background:#f4f4f5;border-radius:10px;padding:24px;text-align:center;margin-bottom:20px;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#111827;">{otp}</span>
        </div>

        <p style="margin:0 0 8px;color:#71717a;font-size:13px;text-align:center;"><strong>Valid for 5 minutes</strong>. Don't share this code with anyone.</p>
        <p style="margin:0 0 16px;color:#71717a;font-size:13px;text-align:center;">Need help? Reply to this email and we'll assist you quickly.</p>
        <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">LearnWork-Flow helps you hit milestones with organized tasks and reminders.</p>
    """
    _send_email_via_brevo(email, 'Reset your LearnWork-Flow password', _base_email(content))
    print(f"✅ Password reset email sent to {email} via Brevo")

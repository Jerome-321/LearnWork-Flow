# 🔔 Notification System - Setup Guide

## ✅ What's Fixed & Connected

Your notification system is now **fully integrated** between React frontend and Django backend:

### Frontend Updates
- ✅ Bell icon in TopNav shows **dynamic unread count**
- ✅ Notifications list displays all unread notifications with "Mark all read" button
- ✅ Notifications **respect user settings** - bell hides when notifications are disabled
- ✅ Settings page has **detailed notification preferences**:
  - Notifications Enabled (master toggle)
  - Task Completed notifications
  - Task Reminders
  - Pet Update notifications
  - AI Suggestion notifications
  - Daily Reminder toggle
- ✅ **Real-time syncing** - notifications auto-fetch every 7 seconds
- ✅ **Post-action syncing** - fetch notifications after task completion

### Backend Updates
- ✅ `Notification` model stores all notifications
- ✅ `UserNotificationSettings` model tracks user preferences
- ✅ API endpoints for:
  - `GET /api/notifications/` - fetch unread notifications
  - `POST /api/notifications/mark-read/` - mark single as read
  - `POST /api/notifications/mark-all-read/` - mark all as read
  - `GET /api/notification-settings/` - fetch user settings
  - `POST /api/notification-settings/update/` - update settings
- ✅ **Auto-notifications** created on:
  - Task completion → "You earned X points!"
  - Pet level up → "Your pet reached level X!"
  - Can easily extend for AI suggestions

---

## 🚀 Setup Instructions

### Step 1: Database Migration

Run these commands in the `backend/` directory:

```bash
# 1. Create migration files for new models
python manage.py makemigrations

# 2. Apply migrations to database
python manage.py migrate

# 3. Start Django server
python manage.py runserver
```

**Expected Output:**
```
Operations to perform:
  Apply all migrations: admin, api, auth, contenttypes, sessions
Running migrations:
  Applying api.0003_usernotificationsettings_notification... OK
```

### Step 2: Test Frontend Connection

After Django is running:

```bash
# In the project root directory
npm run dev
```

**Expected Behavior:**
1. Open app → bell icon shows (if you have unread notifications from testing)
2. Go to Settings → see notification preference toggles
3. Toggle any notification setting → changes sync immediately to backend
4. Complete a task → notification appears automatically
5. Click notification → marked as read, badge decreases

---

## 📋 API Endpoints Reference

### Get Notifications
```bash
GET /api/notifications/
Authorization: Bearer <token>

Response:
{
  "notifications": [
    {
      "id": 1,
      "notification_type": "task_completed",
      "title": "Task Completed! 🎉",
      "message": "You earned 30 points for completing 'Math homework'",
      "task": 5,
      "is_read": false,
      "createdAt": "2024-03-17T10:30:00Z"
    }
  ],
  "unread_count": 1
}
```

### Mark Single Notification Read
```bash
POST /api/notifications/mark-read/
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "notification_id": 1
}
```

### Mark All as Read
```bash
POST /api/notifications/mark-all-read/
Authorization: Bearer <token>
```

### Get Notification Settings
```bash
GET /api/notification-settings/
Authorization: Bearer <token>

Response:
{
  "notifications_enabled": true,
  "task_reminders": true,
  "task_completed": true,
  "pet_updates": true,
  "ai_suggestions": true,
  "daily_reminders": false
}
```

### Update Notification Settings
```bash
POST /api/notification-settings/update/
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "notifications_enabled": true,
  "task_completed": false,
  "pet_updates": true
}
```

---

## 🔧 How It Works

### Notification Creation Flow

When a task is completed:
1. **Frontend:** `toggleTaskComplete()` → calls `updateTask()`
2. **Backend:** `perform_update()` transitions task to completed
3. **Backend:** Calls `create_notification()` helper
4. **Backend:** Checks `UserNotificationSettings` - if enabled → creates `Notification`
5. **Frontend:** Polling fetches new notification after 150ms
6. **UI:** Bell icon updates with unread count

### Settings Sync Flow

When user changes a notification setting:
1. **Frontend:** `handleNotificationSettingChange()` called
2. **Frontend:** Calls `updateNotificationSettings()`
3. **Backend:** Updates `UserNotificationSettings` record
4. **Backend:** Returns updated settings
5. **Frontend:** Updates local state + local storage

---

## 📝 Database Schema

### Notification
```
id (pk)
user_id (fk)
notification_type (choice: task_reminder, task_completed, pet_update, ai_suggestion)
title (str)
message (text)
task_id (fk, nullable)
is_read (bool, default=False)
createdAt (datetime, auto)
```

### UserNotificationSettings
```
id (pk)
user_id (fk, unique)
notifications_enabled (bool, default=True)
task_reminders (bool, default=True)
task_completed (bool, default=True)
pet_updates (bool, default=True)
ai_suggestions (bool, default=True)
daily_reminders (bool, default=False)
createdAt (datetime, auto)
updatedAt (datetime, auto)
```

---

## 🐛 Troubleshooting

### Bell doesn't show unread count
- Check: `notificationSettings?.notifications_enabled` in your browser DevTools
- Solution: Toggle notifications ON in Settings

### Notifications not appearing after task completion
- Check: Backend running and connected (`✅ Connected to Django backend` in console)
- Check: Error in browser console or terminal
- Solution: Manually click refresh button or wait 7 seconds for polling

### Settings changes not saving
- Check: Network tab in DevTools - verify POST to `/notification-settings/update/`
- Check: 401 error = token issue, try signing out and back in
- Check: 400 error = validation issue, check request body

### Migration fails
```
python manage.py migrate --fake initial  # Reset if needed
python manage.py makemigrations
python manage.py migrate
```

---

## 🎯 Next Steps (Optional Enhancements)

1. **Notification Deletion**
   - Add swipe-to-delete on mobile
   - Batch delete old notifications (older than 30 days)

2. **Notification Sound/Email**
   - Add browser notification sound
   - Send email digests for daily reminders

3. **Notification Categories**
   - Filter by type (show only task reminders)
   - Advanced filtering UI

4. **Push Notifications**
   - Service Worker integration
   - Mobile-first PWA notifications

5. **Notification History**
   - View all notifications (including read)
   - Search/filter notification archive

---

## 📞 Questions?

All notification logic is in:
- **Backend:** `backend/api/models.py`, `backend/api/views.py`
- **Frontend:** `src/app/hooks/useTaskAPI.ts`, `src/app/components/TopNav.tsx`, `src/app/pages/SettingsPage.tsx`

Every function is marked with `✅ NEW:` comments for easy navigation!

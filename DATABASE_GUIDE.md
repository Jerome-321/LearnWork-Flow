# Database Guide - Task & Reminder Management Application

## Overview

This application uses **Supabase** as the backend with a **key-value store** architecture using the pre-configured `kv_store_c3569cb3` table in PostgreSQL.

---

## Database Architecture

### Why Key-Value Store?

Due to Figma Make environment limitations (no migration files or DDL statements), we use a flexible key-value approach where:
- **Key**: Unique identifier (e.g., `user:123`, `tasks:123`)
- **Value**: JSON document containing the data

### Benefits:
- ✅ No migrations needed
- ✅ Flexible schema
- ✅ Easy to prototype
- ✅ Suitable for most use cases

---

## Data Structure

### 1. User Data
**Key Pattern:** `user:{userId}`

**Value Structure:**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "name": "User Name",
  "created_at": "2026-02-25T10:30:00Z"
}
```

### 2. Tasks Data
**Key Pattern:** `tasks:{userId}`

**Value Structure:**
```json
[
  {
    "id": "task-uuid-1",
    "title": "Complete project proposal",
    "description": "Write and submit the Q1 proposal",
    "priority": "high",
    "dueDate": "2026-03-01",
    "completed": false,
    "createdAt": "2026-02-25T10:00:00Z",
    "completedAt": null,
    "points": 15
  },
  {
    "id": "task-uuid-2",
    "title": "Review pull requests",
    "priority": "medium",
    "dueDate": "2026-02-26",
    "completed": true,
    "createdAt": "2026-02-24T09:00:00Z",
    "completedAt": "2026-02-25T14:30:00Z",
    "points": 10
  }
]
```

**Priority Levels:** `low`, `medium`, `high`

**Points System:**
- Low priority: 5 points
- Medium priority: 10 points
- High priority: 15 points

### 3. Progress Data
**Key Pattern:** `progress:{userId}`

**Value Structure:**
```json
{
  "totalPoints": 125,
  "level": 3,
  "currentStreak": 7,
  "longestStreak": 14,
  "tasksCompleted": 25,
  "lastCompletedDate": "2026-02-25"
}
```

**Level Calculation:** 
- Level 1: 0-99 points
- Level 2: 100-249 points
- Level 3: 250-499 points
- Level increases every 100 points after level 2

### 4. Virtual Pet Data
**Key Pattern:** `pet:{userId}`

**Value Structure:**
```json
{
  "name": "Fluffy",
  "type": "cat",
  "happiness": 85,
  "health": 90,
  "hunger": 30,
  "level": 3,
  "experience": 450,
  "lastFed": "2026-02-25T12:00:00Z",
  "lastPlayed": "2026-02-25T11:30:00Z"
}
```

**Pet Types:** `cat`, `dog`, `dragon`, `unicorn`

**Stats (0-100):**
- Happiness: Increases when tasks completed
- Health: Decreases over time if not cared for
- Hunger: Increases over time, decreases when fed
- Experience: Increases with task completions

---

## Accessing the Database

### 1. Via Supabase Dashboard

1. **Login to Supabase:**
   - Go to: https://supabase.com/dashboard
   - Sign in with your Supabase account

2. **Find Your Project:**
   - Look for the project with ID matching your `SUPABASE_URL`
   - The URL format: `https://[project-id].supabase.co`

3. **View Data:**
   - **Table Editor** → `kv_store_c3569cb3`: View all key-value data
   - **Authentication** → Users: View registered users
   - **API Logs**: Monitor API requests

### 2. Via SQL Editor (Advanced)

In Supabase Dashboard → SQL Editor:

```sql
-- View all keys
SELECT key FROM kv_store_c3569cb3;

-- View specific user's data
SELECT * FROM kv_store_c3569cb3 
WHERE key LIKE 'user:YOUR-USER-ID';

-- View all tasks
SELECT * FROM kv_store_c3569cb3 
WHERE key LIKE 'tasks:%';

-- View user's tasks and progress
SELECT * FROM kv_store_c3569cb3 
WHERE key LIKE '%:YOUR-USER-ID';
```

---

## API Endpoints

All endpoints are prefixed with: `/make-server-c3569cb3`

### Authentication

#### Sign Up
```http
POST /make-server-c3569cb3/auth/signup
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

#### Sign In (Handled by Supabase Client)
```javascript
// In frontend
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Tasks

#### Get All Tasks
```http
GET /make-server-c3569cb3/tasks
Authorization: Bearer {access_token}
```

#### Create Task
```http
POST /make-server-c3569cb3/tasks
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Task title",
  "description": "Task description",
  "priority": "medium",
  "dueDate": "2026-03-01"
}
```

#### Update Task
```http
PUT /make-server-c3569cb3/tasks/{taskId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Updated title",
  "completed": true
}
```

#### Delete Task
```http
DELETE /make-server-c3569cb3/tasks/{taskId}
Authorization: Bearer {access_token}
```

### Progress

#### Get Progress
```http
GET /make-server-c3569cb3/progress
Authorization: Bearer {access_token}
```

### Virtual Pet

#### Get Pet
```http
GET /make-server-c3569cb3/pet
Authorization: Bearer {access_token}
```

#### Create/Update Pet
```http
POST /make-server-c3569cb3/pet
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Fluffy",
  "type": "cat"
}
```

---

## User Management

### Creating Demo Account

1. **Via Sign Up Page:**
   - Email: `demo@taskly.com`
   - Password: `demo123`
   - Name: `Demo User`

2. **Via API:**
```bash
curl -X POST https://[project-id].supabase.co/functions/v1/make-server-c3569cb3/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -d '{
    "email": "demo@taskly.com",
    "password": "demo123",
    "name": "Demo User"
  }'
```

### Viewing Users

**In Supabase Dashboard:**
1. Go to **Authentication** → **Users**
2. You'll see all registered users with:
   - Email
   - Created date
   - Last sign in
   - User ID (UUID)

**Copy User ID** to query their specific data in Table Editor

---

## Data Examples

### Complete User Data Set

For user ID: `abc-123-def-456`

**Keys in database:**
```
user:abc-123-def-456
tasks:abc-123-def-456
progress:abc-123-def-456
pet:abc-123-def-456
```

### Sample Task Flow

1. **User creates task:**
   ```json
   {
     "id": "task-1",
     "title": "Morning workout",
     "priority": "medium",
     "completed": false,
     "points": 10
   }
   ```

2. **User completes task:**
   - Task updated: `completed: true`, `completedAt: "2026-02-25T08:00:00Z"`
   - Progress updated: `totalPoints += 10`, `tasksCompleted += 1`
   - Streak updated if completed today
   - Pet updated: `happiness += 5`, `experience += 10`

---

## Environment Variables

The following secrets are already configured:

```
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[public-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[admin-key]
SUPABASE_DB_URL=[postgres-connection-string]
```

⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code!**

---

## Security

### Row-Level Security (RLS)

The KV store implements security via **server-side authorization checks**:

```javascript
// Every protected route verifies the user
const accessToken = request.headers.get('Authorization')?.split(' ')[1];
const { data: { user }, error } = await supabase.auth.getUser(accessToken);

if (!user?.id) {
  return new Response('Unauthorized', { status: 401 });
}

// All operations scoped to authenticated user ID
const key = `tasks:${user.id}`;
```

### Best Practices:
- ✅ Always use access token for protected routes
- ✅ Never trust client-provided user IDs
- ✅ Validate all input data
- ✅ Log errors for debugging

---

## Troubleshooting

### Common Issues

**1. "Unauthorized" error:**
- Check if user is signed in
- Verify access token is being sent in Authorization header
- Check token hasn't expired

**2. "Data not found":**
- Verify user ID is correct
- Check if data exists in Supabase Table Editor
- Ensure key pattern matches (e.g., `tasks:userId`)

**3. "Invalid JSON" error:**
- Validate JSON structure before storing
- Check for circular references
- Ensure dates are ISO strings

### Debugging Tips

**Check logs in:**
1. Browser console (frontend errors)
2. Supabase Dashboard → Logs → Edge Functions (backend errors)
3. Network tab (API requests/responses)

**Verify data:**
```sql
-- Check if user data exists
SELECT * FROM kv_store_c3569cb3 WHERE key = 'user:YOUR-USER-ID';

-- Check all keys for a user
SELECT key FROM kv_store_c3569cb3 WHERE key LIKE '%:YOUR-USER-ID';
```

---

## Backup & Export

### Export Data

**Via Supabase Dashboard:**
1. Table Editor → `kv_store_c3569cb3`
2. Click "Export" → Download as CSV

**Via SQL:**
```sql
-- Export all data as JSON
SELECT json_agg(row_to_json(kv_store_c3569cb3)) 
FROM kv_store_c3569cb3;
```

### Backup Strategy

Supabase provides automatic daily backups for paid plans. For free tier:
- Periodically export data via CSV
- Store backups securely
- Test restoration process

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **PostgreSQL JSON Functions:** https://www.postgresql.org/docs/current/functions-json.html

---

## Future Enhancements

Potential improvements while maintaining KV store:

1. **Add timestamps:** Track created/updated times for all records
2. **Add categories:** Organize tasks by category
3. **Add reminders:** Store reminder settings per task
4. **Add achievements:** Track user milestones
5. **Add social features:** Share progress with friends (new keys: `friends:userId`)

All enhancements can be done by extending the JSON structure in existing keys or adding new key patterns!

---

**Last Updated:** February 25, 2026
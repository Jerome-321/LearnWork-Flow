# 🚀 Supabase Edge Function Deployment Guide

## Quick Deploy

Your Taskly app needs this Edge Function deployed to work with Supabase cloud storage.

### Option 1: Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link your project
supabase link --project-ref vgtlxmgasaetioxidboz

# 4. Deploy the Edge Function
supabase functions deploy make-server-c3569cb3
```

### Option 2: Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/vgtlxmgasaetioxidboz
2. Navigate to **Edge Functions** in the sidebar
3. Click **"Deploy new function"**
4. Upload these files from `/supabase/functions/server/`:
   - `index.tsx`
   - `kv_store.tsx`
   - `config.toml`
5. Set function name to: `make-server-c3569cb3`
6. Click **Deploy**

## Verify Deployment

After deployment, test the health endpoint:

```bash
curl https://vgtlxmgasaetioxidboz.supabase.co/functions/v1/make-server-c3569cb3/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-02T...",
  "version": "1.0.1"
}
```

## After Deployment

1. **Refresh your app** - The error banner will disappear
2. **Log in** - Create an account or sign in
3. **Test features**:
   - ✅ Create and complete tasks
   - ✅ Watch your virtual pet grow
   - ✅ Track progress and streaks
   - ✅ All data saves to Supabase

## What This Edge Function Does

- **Authentication**: Verifies user JWT tokens
- **Task Management**: CRUD operations for tasks
- **Progress Tracking**: Manages points, streaks, and pet evolution
- **Data Sync**: Syncs all user data with Supabase KV Store
- **Settings**: User preferences and profile management

## Files Included

- **`server/index.tsx`**: Main API server with all routes
- **`server/kv_store.tsx`**: KV store wrapper for database operations
- **`server/config.toml`**: Edge Function configuration

## Troubleshooting

### Still seeing "Failed to sync" error?

1. Verify deployment status in Supabase dashboard
2. Check function name is exactly: `make-server-c3569cb3`
3. Review logs in Supabase Edge Functions section
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Getting 401 errors?

- Log out and log back in to refresh your session
- Check that JWT verification is working in the Edge Function logs

## Need Help?

- 📚 [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- 💬 [Supabase Discord](https://discord.supabase.com/)
- 🐛 Check the app's Debug Panel (bottom-right corner when logged in)

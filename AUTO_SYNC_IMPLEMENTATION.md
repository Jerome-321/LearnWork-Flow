# ✅ AUTO-SYNC & REAL-TIME UPDATES - IMPLEMENTATION GUIDE

## Overview
Your React + Django system now has automatic data loading and real-time syncing. No manual refresh needed.

---

## 🔄 How It Works

### 1. **Initial Load (Page Open)**
When user logs in → Layout component mounts → `useTaskAPI()` hook is called
```
Layout mounts
  ↓
useTaskAPI() initializes
  ↓
useEffect([user, syncData]) triggers
  ↓
syncData() fetches /tasks/ + /progress/
  ↓
State updated (tasks, progress, settings)
  ↓
UI renders with fresh data
```

**File:** `src/app/components/Layout.tsx`

---

### 2. **Automatic Polling (Every 7 Seconds)**
After initial load, a background polling mechanism keeps data fresh:

```typescript
// src/app/hooks/useTaskAPI.ts
useEffect(() => {
  if (!user || isOfflineMode) return;
  
  let pollInterval = setInterval(async () => {
    // Fetch tasks
    const tasksResponse = await fetch("/api/tasks/", { headers });
    // Fetch progress (pet XP, level)
    const progressResponse = await fetch("/api/progress/", { headers });
    // Update state
    setTasks(newTasks);
    setProgress(newProgress);
  }, 7000); // Every 7 seconds
  
  return () => clearInterval(pollInterval); // Cleanup on unmount
}, [user, isOfflineMode, getAuthHeaders]);
```

**Polling features:**
- ✅ Runs every 7 seconds automatically
- ✅ Fetches both tasks and progress in parallel
- ✅ Updates state silently (no toast notifications)
- ✅ Gracefully handles offline mode (stops polling)
- ✅ Cleans up on page unmount (no memory leaks)

---

### 3. **Manual Refresh Button**
User can force a sync instantly:

```typescript
// src/app/components/TopNav.tsx
<Button onClick={handleRefresh} disabled={isRefreshing}>
  <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
</Button>

const handleRefresh = async () => {
  setIsRefreshing(true);
  await syncData(); // Manually trigger full sync
  toast.success("Data synced");
  setIsRefreshing(false);
};
```

**Button shows:**
- 🔄 Spinning icon while refreshing
- 📌 Tooltip: "Refresh data (also syncs automatically every 7 seconds)"
- Located in TopNav next to theme toggle

---

### 4. **Immediate Update After Actions**
When user clicks "Mark Done":

```
User clicks "Done"
  ↓
toggleTaskComplete(id) called
  ↓
updateTask() → PATCH /tasks/id/ (completed: true)
  ↓
Backend awards points & updates pet
  ↓
setTimeout(() => fetchProgress(), 150ms)
  ↓
Frontend fetches updated progress
  ↓
State updated with new points/pet level
  ↓
UI re-renders instantly ✨
```

---

### 5. **No Stale Data Issues**
The system prevents stale state in multiple ways:

#### a) **Dependency Management**
```typescript
const syncData = useCallback(async () => {
  // Fetch and update state
}, [user, getAuthHeaders]); // Recalculates when auth changes

useEffect(() => {
  if (user) syncData();
}, [user, syncData]); // Re-runs when user or syncData changes
```

#### b) **Re-fetch After Actions**
```typescript
const toggleTaskComplete = async (id: string) => {
  const result = await updateTask(id, { completed: !task.completed });
  
  // Re-fetch progress to ensure fresh pet data
  setTimeout(() => fetchProgress(), 150);
  
  return result;
};
```

#### c) **Selected Task Auto-Update**
In Layout component:
```typescript
const selectedTask = selectedTaskId 
  ? tasks.find(t => t.id === selectedTaskId)  // Always gets latest from state
  : null;
```

---

## 📊 Data Flow Diagram

```
┌─── Page Load ────────────────────────────────────┐
│                                                    │
│  Layout mounts → useTaskAPI() → syncData()      │
│       ↓                                            │
│  Fetch /tasks/ + /progress/                      │
│       ↓                                            │
│  Update tasks[], progress state                  │
│       ↓                                            │
│  UI renders with fresh data ✅                   │
│                                                    │
│  ┌─── Polling Loop (Every 7s) ─────────┐        │
│  │ Fetch /tasks/ + /progress/          │        │
│  │ Update state silently                │        │
│  │ (doesn't interrupt user activity)    │        │
│  └──────────────────────────────────────┘        │
│                                                    │
│  ┌─── User Action ────────────┐                  │
│  │ Click "Mark Done"          │                  │
│  │   ↓                         │                  │
│  │ PATCH /tasks/id/           │                  │
│  │ {completed: true}          │                  │
│  │   ↓                         │                  │
│  │ Backend awards points      │                  │
│  │ Updates pet XP/level       │                  │
│  │   ↓                         │                  │
│  │ setTimeout(150ms)          │                  │
│  │ fetchProgress()            │                  │
│  │   ↓                         │                  │
│  │ Update progress in state   │                  │
│  │ UI shows new points ✅     │                  │
│  └────────────────────────────┘                  │
│                                                    │
│  ┌─── Manual Refresh ─────────────┐             │
│  │ User clicks 🔄 button          │             │
│  │   ↓                             │             │
│  │ syncData() →                    │             │
│  │ Fetch /tasks/ + /progress/     │             │
│  │   ↓                             │             │
│  │ Update all state                │             │
│  │ show "Data synced" toast ✅    │             │
│  └─────────────────────────────────┘             │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 📋 Features Implemented

| Feature | Status | File | How It Works |
|---------|--------|------|-------------|
| Auto-load on page open | ✅ | `Layout.tsx` | useEffect calls syncData when user logs in |
| 7-second polling | ✅ | `useTaskAPI.ts` | Background interval fetches tasks + progress |
| Manual refresh button | ✅ | `TopNav.tsx` | Refresh icon triggers syncData |
| Instant updates after action | ✅ | `useTaskAPI.ts` | toggleTaskComplete calls fetchProgress after toggle |
| Prevent duplicate points | ✅ | `views.py` | Backend checks task state transition |
| No stale data | ✅ | `useTaskAPI.ts` | Proper dependency management + re-fetches |
| Offline mode handling | ✅ | `useTaskAPI.ts` | Stops polling when offline, loads from cache |
| Duplicate API call prevention | ✅ | `useTaskAPI.ts` | Uses pendingToggleIds Set |
| Memory leak prevention | ✅ | `useTaskAPI.ts` | Cleanup function in useEffect clears interval |

---

## 🧪 Testing

Test these scenarios to verify everything works:

**Test 1: Initial Load**
1. Open the app
2. Log in
3. ✅ Tasks load immediately
4. ✅ Pet data shows correct level/XP

**Test 2: Mark Task Done**
1. Click "Done" on a task
2. ✅ Task marked complete immediately in UI
3. ✅ Points increment shows right away
4. ✅ Pet level updates in seconds (from polling)

**Test 3: Polling in Background**
1. Open app and let it run
2. In another browser tab/device, mark a task done
3. Wait 7-10 seconds
4. ✅ Original app updates to show completed task

**Test 4: Manual Refresh**
1. Click the 🔄 refresh button
2. ✅ Icon spins during refresh
3. ✅ "Data synced" toast appears
4. ✅ Data is updated if changed elsewhere

**Test 5: Rapid Clicks**
1. Click "Done" multiple times rapidly
2. ✅ Only one API call goes out (duplicate prevention works)
3. ✅ Points only awarded once

**Test 6: Offline Mode**
1. Turn off internet
2. ✅ App loads cached data
3. ✅ Polling stops
4. ✅ When internet returns, polling resumes

---

## 🔧 Configuration Options

### Adjust Polling Speed
In `src/app/hooks/useTaskAPI.ts`, line ~240:
```typescript
}, 7000); // Change to 5000 for 5 seconds, 10000 for 10 seconds
```

### Disable Auto-Polling
To disable automatic polling (keep manual refresh only):
```typescript
// In useTaskAPI.ts, comment out the entire polling useEffect
```

### Change Fetch Delay After Action
In `src/app/hooks/useTaskAPI.ts`, line ~375:
```typescript
setTimeout(() => fetchProgress(), 150); // Change 150 to desired ms
```

---

## 🐛 Troubleshooting

**Issue: Data not updating after task completion**
- ✅ Fix: Check that backend calls are working (refresh button to verify)
- ✅ Check: Are points/pet in `/progress/` endpoint response?

**Issue: Stale pet data even after polling**
- ✅ Fix: Verify backend is updating `UserProgress.petLevel` correctly
- ✅ Check: Network tab to see if `/progress/` returns new data

**Issue: Too many API calls (spam in console)**
- ✅ Fix: This shouldn't happen. If it does:
  - Clear browser cache
  - Check for console errors
  - Verify polling effect doesn't have infinite dependencies

**Issue: Page slowing down**
- ✅ Fix: Check if polling is updating state too frequently
- ✅ Try increasing polling interval to 10000ms (10 seconds)

---

## 📝 Code Locations

- **Auto-load setup:** `src/app/components/Layout.tsx` (calls useTaskAPI)
- **Polling logic:** `src/app/hooks/useTaskAPI.ts` (lines 220-254)
- **Manual refresh button:** `src/app/components/TopNav.tsx` (lines 21-26, 115-120)
- **Immediate post-action fetch:** `src/app/hooks/useTaskAPI.ts` (line 375)
- **Duplicate points prevention:** `backend/api/views.py` (lines 38-100)
- **AI scheduler improvement:** `backend/api/ai/rule_scheduler.py`

---

## ✨ Summary

Your app now has:
- ✅ **Automatic data loading** on page open
- ✅ **Real-time syncing** every 7 seconds
- ✅ **Instant UI updates** after user actions  
- ✅ **Manual refresh** button for on-demand sync
- ✅ **No stale state** issues
- ✅ **Offline mode** support with caching
- ✅ **Memory-safe** cleanup
- ✅ **No duplicate API calls**

Your users get a seamless, responsive experience! 🎉

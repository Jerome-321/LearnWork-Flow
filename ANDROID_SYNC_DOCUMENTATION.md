# Android Background Sync Implementation

## Overview
LearnWorkFlow now includes **automatic background synchronization** for Android devices. This ensures your tasks, work schedules, and progress data stay in sync even when the app is closed or in the background.

## Features

### 🔄 Automatic Background Sync
- **Periodic Sync**: Syncs every 15 minutes (Android's minimum interval)
- **Network-Aware**: Only syncs when device has network connectivity
- **Battery-Efficient**: Uses Android WorkManager for optimized battery usage

### 📱 Foreground Sync
- **App Resume**: Automatically syncs when app comes to foreground
- **Network Reconnection**: Syncs immediately when network becomes available
- **Manual Sync**: Users can trigger sync via the sync button

### 💾 Offline Support
- **Local Storage**: All data cached locally using IndexedDB
- **Pending Actions Queue**: Changes made offline are queued and synced later
- **Conflict Resolution**: Server data takes precedence during sync

## Architecture

### Android Components

#### 1. **SyncWorker.java**
```
Location: android/app/src/main/java/com/jerome/learnworkflow/SyncWorker.java
```
- Android WorkManager worker that runs in background
- Triggers sync events via JavaScript bridge
- Handles retry logic on failure

#### 2. **MainActivity.java**
```
Location: android/app/src/main/java/com/jerome/learnworkflow/MainActivity.java
```
- Initializes background sync on app start
- Triggers foreground sync when app resumes
- Maintains bridge reference for communication

### TypeScript/React Components

#### 3. **androidSyncService.ts**
```
Location: src/app/utils/androidSyncService.ts
```
- Listens for Android sync events
- Coordinates with existing SyncService
- Handles authentication token management

#### 4. **syncService.ts** (Existing)
```
Location: src/app/utils/syncService.ts
```
- Core sync logic (pull from backend, push pending changes)
- Handles tasks, work schedules, and user progress
- Manages offline storage and pending actions queue

#### 5. **AuthContext.tsx** (Enhanced)
```
Location: src/app/contexts/AuthContext.tsx
```
- Initializes Android sync on login
- Provides access token to sync service

## Sync Flow

### Background Sync (Every 15 Minutes)
```
1. Android WorkManager triggers SyncWorker
2. SyncWorker dispatches 'android-background-sync' event
3. AndroidSyncService receives event
4. Calls SyncService.syncWithBackend()
5. SyncService:
   a. Pulls latest data from backend
   b. Pushes pending local changes
   c. Pulls again to get server updates
   d. Updates local storage
```

### Foreground Sync (App Resume)
```
1. User opens app or switches back to it
2. MainActivity.onResume() dispatches 'android-foreground-sync' event
3. AndroidSyncService receives event
4. Triggers immediate sync
```

### Network Reconnection Sync
```
1. Device regains network connectivity
2. Browser fires 'online' event
3. AndroidSyncService receives event
4. Triggers immediate sync
```

## Data Synchronized

### Tasks
- Task creation, updates, deletions
- Task completion status
- Task priorities and deadlines
- Task descriptions and titles

### Work Schedules
- Schedule creation, updates, deletions
- Start/end times
- Days of week
- Schedule names

### User Progress
- XP and level
- Streak data (current, longest, total days)
- Pet evolution state
- Leaderboard rankings

## Configuration

### Android Build Configuration
**File**: `android/app/build.gradle`

Added dependency:
```gradle
implementation "androidx.work:work-runtime:2.9.0"
```

### Sync Interval
**Default**: 15 minutes (Android minimum)

To change (in MainActivity.java):
```java
PeriodicWorkRequest syncRequest = new PeriodicWorkRequest.Builder(
    SyncWorker.class,
    15, TimeUnit.MINUTES  // Change this value
)
```

### Network Constraints
**Current**: Requires any network connection

To require WiFi only (in MainActivity.java):
```java
Constraints constraints = new Constraints.Builder()
    .setRequiredNetworkType(NetworkType.UNMETERED)  // WiFi only
    .build();
```

## Testing

### Test Background Sync
1. Build and install Android app
2. Login to your account
3. Close the app completely
4. Wait 15 minutes
5. Check Android logs: `adb logcat | grep SyncWorker`

### Test Foreground Sync
1. Open the app
2. Switch to another app
3. Switch back to LearnWorkFlow
4. Check console logs for "Foreground sync triggered"

### Test Offline Mode
1. Turn off network connectivity
2. Create/update tasks
3. Turn network back on
4. Verify changes sync to backend

### Manual Sync Test
```typescript
// In browser console or React component
import { AndroidSyncService } from './utils/androidSyncService';
await AndroidSyncService.manualSync();
```

## Monitoring

### Android Logs
```bash
# View all sync-related logs
adb logcat | grep -E "SyncWorker|AndroidSyncService"

# View WorkManager status
adb shell dumpsys jobscheduler | grep com.jerome.learnworkflow
```

### Browser Console
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'sync');

// Check last sync time
const lastSync = await OfflineStorage.getLastSyncTime();
console.log('Last sync:', new Date(lastSync));

// Check pending actions
const pending = await OfflineStorage.getPendingActions();
console.log('Pending actions:', pending);
```

## Troubleshooting

### Sync Not Working
1. **Check network connectivity**: Ensure device has internet
2. **Verify authentication**: Check if access token is valid
3. **Check WorkManager**: `adb shell dumpsys jobscheduler`
4. **Review logs**: `adb logcat | grep SyncWorker`

### Sync Conflicts
- Server data always takes precedence
- Local changes are applied on top of server data
- Temp IDs are replaced with server IDs after sync

### Battery Optimization
If sync stops working:
1. Go to Android Settings > Apps > LearnWorkFlow
2. Battery > Unrestricted
3. This prevents Android from killing background sync

## Performance

### Battery Impact
- **Minimal**: WorkManager optimizes battery usage
- **Network-aware**: Only syncs when connected
- **Doze-compatible**: Works with Android Doze mode

### Data Usage
- **Efficient**: Only syncs changed data
- **Compressed**: Uses JSON for minimal payload
- **Incremental**: Pulls only new/updated records

### Storage
- **IndexedDB**: Stores all data locally
- **Automatic cleanup**: Old data removed after sync
- **Size**: ~1-5MB typical usage

## Security

### Authentication
- Access tokens stored securely in localStorage
- Tokens refreshed automatically
- Expired tokens trigger re-authentication

### Data Privacy
- All sync traffic uses HTTPS
- No sensitive data in logs
- Local data encrypted by Android

## Future Enhancements

### Planned Features
- [ ] Configurable sync interval
- [ ] WiFi-only sync option in settings
- [ ] Sync progress indicator
- [ ] Conflict resolution UI
- [ ] Selective sync (tasks only, schedules only, etc.)
- [ ] Background sync statistics

### Optimization Opportunities
- Delta sync (only changed fields)
- Compression for large payloads
- Batch sync for multiple users
- Smart sync (predict when user needs data)

## API Endpoints Used

### Pull Data
- `GET /api/tasks/` - Fetch all tasks
- `GET /api/work-schedules/` - Fetch all work schedules
- `GET /api/progress/` - Fetch user progress

### Push Data
- `POST /api/tasks/` - Create task
- `PATCH /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task
- `POST /api/work-schedules/` - Create schedule
- `PATCH /api/work-schedules/{id}/` - Update schedule
- `DELETE /api/work-schedules/{id}/` - Delete schedule

## Building for Production

### 1. Build Android App
```bash
cd LearnWork-Flow
npm run build
npx cap sync android
npx cap open android
```

### 2. Generate Signed APK
1. Open Android Studio
2. Build > Generate Signed Bundle/APK
3. Select APK
4. Create/select keystore
5. Build release APK

### 3. Test Release Build
```bash
adb install -r app-release.apk
adb logcat | grep SyncWorker
```

## Support

### Common Issues
- **Sync not triggering**: Check battery optimization settings
- **Authentication errors**: Clear app data and re-login
- **Network errors**: Verify backend API is accessible

### Debug Mode
Enable debug logging:
```typescript
// In AuthContext or App.tsx
if (process.env.NODE_ENV === 'development') {
  window.DEBUG_SYNC = true;
}
```

## Version History

### v1.0.0 (Current)
- Initial Android sync implementation
- Background sync every 15 minutes
- Foreground sync on app resume
- Network reconnection sync
- Offline support with pending actions queue

---

**Last Updated**: 2024
**Maintained By**: LearnWorkFlow Team

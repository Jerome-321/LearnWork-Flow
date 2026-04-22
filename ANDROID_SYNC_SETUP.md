# Android Sync - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Android Studio installed
- Node.js and npm installed
- Capacitor CLI installed (`npm install -g @capacitor/cli`)

### Step 1: Install Dependencies
```bash
cd LearnWork-Flow
npm install
```

### Step 2: Build Web App
```bash
npm run build
```

### Step 3: Sync with Android
```bash
npx cap sync android
```

### Step 4: Open in Android Studio
```bash
npx cap open android
```

### Step 5: Build and Run
1. In Android Studio, click the green "Run" button
2. Select your device/emulator
3. Wait for app to install and launch

## ✅ Verify Sync is Working

### Method 1: Check Logs
```bash
adb logcat | grep -E "SyncWorker|AndroidSyncService"
```

You should see:
```
AndroidSyncService: Initialized
AndroidSyncService: Foreground sync triggered
AndroidSyncService: Starting sync (trigger: foreground)
AndroidSyncService: Sync completed - X synced, 0 failed
```

### Method 2: Test Offline Mode
1. Open the app and login
2. Turn on Airplane Mode
3. Create a new task
4. Turn off Airplane Mode
5. Check if task appears on web version

### Method 3: Test Background Sync
1. Open the app and login
2. Close the app completely
3. Wait 15 minutes
4. Check logs: `adb logcat | grep SyncWorker`
5. Should see "Background sync triggered"

## 🔧 Troubleshooting

### Sync Not Working?

**Problem**: No sync logs appearing
**Solution**: 
```bash
# Check if WorkManager is scheduled
adb shell dumpsys jobscheduler | grep com.jerome.learnworkflow

# If not found, reinstall the app
adb uninstall com.jerome.learnworkflow
# Then rebuild and install
```

**Problem**: "Bridge not available" error
**Solution**: 
- Make sure app is running in foreground
- Check if MainActivity.getBridge() returns null
- Restart the app

**Problem**: Authentication errors
**Solution**:
```bash
# Clear app data
adb shell pm clear com.jerome.learnworkflow
# Re-login to the app
```

## 📱 Testing on Physical Device

### Enable USB Debugging
1. Go to Settings > About Phone
2. Tap "Build Number" 7 times
3. Go to Settings > Developer Options
4. Enable "USB Debugging"

### Connect Device
```bash
# Check if device is connected
adb devices

# If not listed, install USB drivers for your device
```

### Install and Test
```bash
# Install APK
adb install -r app-debug.apk

# View logs
adb logcat | grep -E "SyncWorker|AndroidSyncService"
```

## 🎯 What Gets Synced?

### ✅ Tasks
- New tasks created offline
- Task updates (title, description, priority)
- Task completion status
- Task deletions

### ✅ Work Schedules
- New schedules created offline
- Schedule updates (time, days)
- Schedule deletions

### ✅ User Progress
- XP and level
- Streak data
- Pet evolution
- Leaderboard rankings

## ⚙️ Configuration Options

### Change Sync Interval
**File**: `android/app/src/main/java/com/jerome/learnworkflow/MainActivity.java`

```java
// Change from 15 minutes to 30 minutes
PeriodicWorkRequest syncRequest = new PeriodicWorkRequest.Builder(
    SyncWorker.class,
    30, TimeUnit.MINUTES  // Changed from 15 to 30
)
```

### WiFi-Only Sync
**File**: `android/app/src/main/java/com/jerome/learnworkflow/MainActivity.java`

```java
// Change network constraint
Constraints constraints = new Constraints.Builder()
    .setRequiredNetworkType(NetworkType.UNMETERED)  // WiFi only
    .build();
```

### Disable Background Sync
**File**: `android/app/src/main/java/com/jerome/learnworkflow/MainActivity.java`

```java
// Comment out this line in onCreate()
// setupBackgroundSync();
```

## 📊 Monitoring Sync Status

### In-App Monitoring
The app includes a sync status indicator that shows:
- 🟢 **Online**: Connected and synced
- 🟡 **Pending**: X changes waiting to sync
- 🔵 **Syncing**: Sync in progress
- 🔴 **Offline**: No network connection

### Console Monitoring
Open Chrome DevTools (chrome://inspect) and check console:
```javascript
// Check last sync time
const lastSync = await OfflineStorage.getLastSyncTime();
console.log('Last sync:', new Date(lastSync));

// Check pending actions
const pending = await OfflineStorage.getPendingActions();
console.log('Pending:', pending.length);
```

## 🔐 Security Notes

### Access Tokens
- Stored securely in localStorage
- Automatically refreshed
- Never logged or exposed

### HTTPS Only
- All sync traffic uses HTTPS
- Backend API: https://learnwork-flow.onrender.com

### Data Privacy
- Local data encrypted by Android
- No sensitive data in logs
- Sync only when authenticated

## 🚀 Production Deployment

### Generate Signed APK
1. Open Android Studio
2. Build > Generate Signed Bundle/APK
3. Select APK
4. Create keystore (first time only):
   - Key store path: `android/app/learnworkflow.jks`
   - Password: (choose secure password)
   - Alias: `learnworkflow`
5. Build release APK

### Upload to Google Play
1. Go to Google Play Console
2. Create new app
3. Upload APK
4. Fill in app details
5. Submit for review

## 📚 Additional Resources

- **Full Documentation**: See `ANDROID_SYNC_DOCUMENTATION.md`
- **Capacitor Docs**: https://capacitorjs.com/docs
- **WorkManager Guide**: https://developer.android.com/topic/libraries/architecture/workmanager
- **Backend API**: https://learnwork-flow.onrender.com

## 🆘 Need Help?

### Common Commands
```bash
# View all logs
adb logcat

# Filter sync logs
adb logcat | grep -E "SyncWorker|AndroidSyncService"

# Clear app data
adb shell pm clear com.jerome.learnworkflow

# Uninstall app
adb uninstall com.jerome.learnworkflow

# Check WorkManager jobs
adb shell dumpsys jobscheduler | grep com.jerome.learnworkflow
```

### Debug Checklist
- [ ] App is installed and running
- [ ] User is logged in
- [ ] Device has network connectivity
- [ ] Battery optimization is disabled for app
- [ ] WorkManager job is scheduled
- [ ] Access token is valid

---

**Setup Time**: ~5 minutes  
**Difficulty**: Easy  
**Status**: Production Ready ✅

package com.jerome.learnworkflow;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import java.util.concurrent.TimeUnit;

public class MainActivity extends BridgeActivity {
    private static MainActivity instance;
    
    public static MainActivity getInstance() {
        return instance;
    }
    
    public Bridge getBridgeInstance() {
        return this.bridge;
    }
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        try {
            super.onCreate(savedInstanceState);
            instance = this;
            
            // Don't let content go under status bar
            WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
            
            // Set status bar color to white
            getWindow().setStatusBarColor(getResources().getColor(android.R.color.white));
            
            // Set status bar icons to dark (for light background)
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            );
            
            // Setup background sync
            setupBackgroundSync();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        // Trigger sync when app comes to foreground
        if (bridge != null) {
            bridge.eval("window.dispatchEvent(new CustomEvent('android-foreground-sync'))", null);
        }
    }
    
    private void setupBackgroundSync() {
        // Constraints: only sync when connected to network
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();
        
        // Periodic sync every 15 minutes (minimum allowed by Android)
        PeriodicWorkRequest syncRequest = new PeriodicWorkRequest.Builder(
            SyncWorker.class,
            15, TimeUnit.MINUTES
        )
        .setConstraints(constraints)
        .build();
        
        // Enqueue with replace policy to avoid duplicates
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "background-sync",
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        );
    }
}

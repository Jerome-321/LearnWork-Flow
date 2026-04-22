package com.jerome.learnworkflow;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import com.getcapacitor.Bridge;

public class SyncWorker extends Worker {
    private static final String TAG = "SyncWorker";

    public SyncWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d(TAG, "Background sync started");
        
        try {
            // Trigger sync via JavaScript bridge
            Bridge bridge = MainActivity.getBridge();
            if (bridge != null) {
                bridge.getActivity().runOnUiThread(() -> {
                    bridge.eval("window.dispatchEvent(new CustomEvent('android-background-sync'))", null);
                });
                Log.d(TAG, "Sync event dispatched");
                return Result.success();
            } else {
                Log.w(TAG, "Bridge not available, will retry");
                return Result.retry();
            }
        } catch (Exception e) {
            Log.e(TAG, "Sync failed: " + e.getMessage());
            return Result.failure();
        }
    }
}

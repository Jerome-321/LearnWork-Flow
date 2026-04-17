package com.jerome.learnworkflow;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        try {
            super.onCreate(savedInstanceState);
            
            // Don't let content go under status bar
            WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
            
            // Set status bar color to white
            getWindow().setStatusBarColor(getResources().getColor(android.R.color.white));
            
            // Set status bar icons to dark (for light background)
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            );
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

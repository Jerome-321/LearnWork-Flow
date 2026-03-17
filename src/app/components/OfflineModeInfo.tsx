import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import { Card } from "./ui/card";

export function OfflineModeInfo() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this info
    const hasDismissed = localStorage.getItem("taskly_offline_info_dismissed");
    if (hasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("taskly_offline_info_dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="p-4">
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Welcome to Taskly! 🎉
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              You're currently using <strong>Offline Mode</strong>. All your tasks, progress, and pet evolution are saved in your browser's local storage.
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mb-3">
              <li>✅ All features work perfectly offline</li>
              <li>📱 Data persists in your browser</li>
              <li>🔒 Your data is private and secure</li>
            </ul>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>Optional:</strong> Deploy the Edge Function to enable cloud sync across devices. Click "Deploy to Cloud" in the blue banner above.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full h-fit"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      </Card>
    </div>
  );
}

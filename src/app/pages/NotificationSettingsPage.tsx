import { useState, useEffect } from "react";
import { Bell, Clock, Trophy, Sparkles, Calendar } from "lucide-react";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { NotificationScheduler } from "../utils/notificationScheduler";
import { toast } from "sonner";

export function NotificationSettingsPage() {
  const { notificationSettings, updateNotificationSettings, tasks } = useTaskAPI();
  const [localSettings, setLocalSettings] = useState({
    notifications_enabled: true,
    task_completed: true,
    task_reminders: true,
    pet_updates: true,
    ai_suggestions: true,
    daily_reminders: true,
  });

  useEffect(() => {
    if (notificationSettings) {
      setLocalSettings(notificationSettings);
    }
  }, [notificationSettings]);

  const handleToggle = async (key: string, value: boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);

    try {
      await updateNotificationSettings({ [key]: value });
      
      // If task reminders are disabled, cancel all scheduled notifications
      if (key === 'task_reminders' && !value) {
        await NotificationScheduler.cancelAll();
        toast.success("All task reminders cancelled");
      }
      
      // If task reminders are enabled, reschedule all tasks
      if (key === 'task_reminders' && value) {
        await NotificationScheduler.rescheduleAllTasks(tasks);
        toast.success("Task reminders enabled");
      }
      
      // If daily reminders are toggled
      if (key === 'daily_reminders') {
        if (value) {
          await NotificationScheduler.scheduleDailySummary(8, 0);
          toast.success("Daily summary scheduled for 8:00 AM");
        } else {
          // Cancel daily summary (ID: 999999)
          toast.success("Daily summary cancelled");
        }
      }
      
      toast.success("Settings updated");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update settings");
      // Revert on error
      setLocalSettings(localSettings);
    }
  };

  const testNotification = async () => {
    try {
      await NotificationScheduler.sendImmediateNotification(
        "🔔 Test Notification",
        "Notifications are working correctly!",
        { type: "test" }
      );
      toast.success("Test notification sent!");
    } catch (error) {
      toast.error("Failed to send test notification");
    }
  };

  const getPendingCount = async () => {
    const pending = await NotificationScheduler.getPendingNotifications();
    toast.info(`You have ${pending.length} pending notifications scheduled`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-slate-950">Notification Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage how and when you receive notifications
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Master Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded-lg">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <Label className="text-base font-medium">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Master switch for all notifications
                </p>
              </div>
            </div>
            <Switch
              checked={localSettings.notifications_enabled}
              onCheckedChange={(checked) => handleToggle('notifications_enabled', checked)}
            />
          </div>
        </Card>

        {/* Individual Settings */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Notification Types
          </h2>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified before task deadlines
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.task_reminders}
                onCheckedChange={(checked) => handleToggle('task_reminders', checked)}
                disabled={!localSettings.notifications_enabled}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">Task Completed</Label>
                  <p className="text-sm text-muted-foreground">
                    Celebrate when you complete tasks
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.task_completed}
                onCheckedChange={(checked) => handleToggle('task_completed', checked)}
                disabled={!localSettings.notifications_enabled}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">Pet Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your pet levels up
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.pet_updates}
                onCheckedChange={(checked) => handleToggle('pet_updates', checked)}
                disabled={!localSettings.notifications_enabled}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">AI Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Smart scheduling recommendations
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.ai_suggestions}
                onCheckedChange={(checked) => handleToggle('ai_suggestions', checked)}
                disabled={!localSettings.notifications_enabled}
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Morning summary at 8:00 AM
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.daily_reminders}
                onCheckedChange={(checked) => handleToggle('daily_reminders', checked)}
                disabled={!localSettings.notifications_enabled}
              />
            </div>
          </Card>
        </div>

        {/* Test Section */}
        <div className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Testing
          </h2>

          <Card className="p-4 space-y-3">
            <Button
              onClick={testNotification}
              className="w-full"
              variant="outline"
            >
              Send Test Notification
            </Button>
            
            <Button
              onClick={getPendingCount}
              className="w-full"
              variant="outline"
            >
              Check Pending Notifications
            </Button>
          </Card>
        </div>

        {/* Info */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <Bell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">About Notifications</p>
              <p className="text-blue-700">
                Task reminders are sent at 1 day, 1 hour, and 15 minutes before the deadline.
                All notifications work offline and will be delivered even without internet connection.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import {
  Settings,
  User,
  Bell,
  Palette,
  Sparkles,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

export function SettingsPage() {
  const { settings, updateSettings, notificationSettings, updateNotificationSettings, fetchNotificationSettings } = useTaskAPI();
  const { isSubscribed, isLoading, permission, isSupported, subscriptionChecked, subscribe, unsubscribe, requestNotificationPermission, checkSubscriptionStatus } = usePushNotifications();
  const { signOut, user, getAccessToken } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || "https://learnwork-flow.onrender.com/api";

  const sendTestNotification = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      if (!isSupported) {
        toast.error('Push notifications are not supported in this browser');
        return;
      }

      // Ensure permission is granted
      let currentPermission = permission;
      if (currentPermission === 'default') {
        currentPermission = await requestNotificationPermission();
      }

      if (currentPermission === 'denied') {
        toast.error('Notification permission is denied. Enable it in browser settings.');
        return;
      }

      // Ensure subscription status is up to date
      if (!subscriptionChecked) {
        await checkSubscriptionStatus();
      }

      if (!isSubscribed) {
        try {
          await subscribe();
          await checkSubscriptionStatus();
        } catch (error) {
          console.error('Subscription failed during test send:', error);
          toast.error('Unable to enable push notifications. Please try again.');
          return;
        }
      }

      const response = await fetch(`${API_URL}/notifications/send-test/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Test notification sent! Check your device.');
      } else {
        toast.error(data.message || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error('Failed to send test notification');
    }
  };
  const [displayName, setDisplayName] = useState(settings?.displayName || "");
  const [email, setEmail] = useState(settings?.email || user?.email || "");
  
  // ✅ NEW: Local state for notification settings
  const [localNotifSettings, setLocalNotifSettings] = useState(notificationSettings || null);

  // ✅ NEW: Fetch notification settings on mount
  useEffect(() => {
    if (!localNotifSettings && notificationSettings) {
      setLocalNotifSettings(notificationSettings);
    }
  }, [notificationSettings, localNotifSettings]);

  const handleSaveProfile = async () => {
    try {
      await updateSettings({ displayName, email });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  // ✅ NEW: Handle notification setting changes
  const handleNotificationSettingChange = async (key: string, value: boolean) => {
    try {
      setLocalNotifSettings(prev => prev ? { ...prev, [key]: value } : null);
      await updateNotificationSettings({ [key]: value });
      toast.success("Notification settings updated");
    } catch (error) {
      toast.error("Failed to update notification settings");
    }
  };

  const handleResetData = async () => {
    await signOut();
    window.location.reload();
  };

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      <div className="border-b bg-card shadow-sm">
        <div className="p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your preferences and account
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>

              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </CardContent>
          </Card>

          {/* ✅ NEW: Notifications Settings - Connected to Backend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main notifications toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Notifications Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn off to disable all notifications
                  </p>
                </div>
                <Switch
                  checked={localNotifSettings?.notifications_enabled ?? true}
                  onCheckedChange={(checked) => 
                    handleNotificationSettingChange("notifications_enabled", checked)
                  }
                />
              </div>

              <Separator />

              {/* Notification type toggles - only show if notifications are enabled */}
              {localNotifSettings?.notifications_enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Task Completed</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you complete a task
                      </p>
                    </div>
                    <Switch
                      checked={localNotifSettings?.task_completed ?? true}
                      onCheckedChange={(checked) => 
                        handleNotificationSettingChange("task_completed", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders for upcoming tasks
                      </p>
                    </div>
                    <Switch
                      checked={localNotifSettings?.task_reminders ?? true}
                      onCheckedChange={(checked) => 
                        handleNotificationSettingChange("task_reminders", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Pet Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when your pet levels up
                      </p>
                    </div>
                    <Switch
                      checked={localNotifSettings?.pet_updates ?? true}
                      onCheckedChange={(checked) => 
                        handleNotificationSettingChange("pet_updates", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>AI Suggestions</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive smart task scheduling suggestions
                      </p>
                    </div>
                    <Switch
                      checked={localNotifSettings?.ai_suggestions ?? true}
                      onCheckedChange={(checked) => 
                        handleNotificationSettingChange("ai_suggestions", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get daily summaries of your tasks
                      </p>
                    </div>
                    <Switch
                      checked={localNotifSettings?.daily_reminders ?? false}
                      onCheckedChange={(checked) => 
                        handleNotificationSettingChange("daily_reminders", checked)
                      }
                    />
                  </div>

                  <Separator />

                  {/* Push Notification Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified before due tasks
                      </p>
                      {!isSupported && (
                        <p className="text-sm text-red-500">
                          Push notifications not supported in this browser
                        </p>
                      )}
                      {isSupported && permission === 'denied' && (
                        <p className="text-sm text-red-500">
                          Permission denied. Enable notifications in browser settings.
                        </p>
                      )}
                      {isSupported && permission !== 'denied' && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            size="sm"
                            variant={isSubscribed ? 'destructive' : 'secondary'}
                            onClick={async () => {
                              try {
                                if (isSubscribed) {
                                  await unsubscribe();
                                  toast.success('Push notifications disabled');
                                } else {
                                  await subscribe();
                                  toast.success('Push notifications enabled');
                                }
                              } catch (error) {
                                if (error instanceof Error && error.message === 'Permission denied') {
                                  toast.error('Permission denied');
                                } else {
                                  toast.error('Failed to update push notifications');
                                }
                              }
                            }}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Loading...' : isSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
                          </Button>
                          {isSubscribed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await sendTestNotification();
                                } catch {
                                  // errors handled inside sendTestNotification
                                }
                              }}
                              disabled={isLoading}
                            >
                              Send test notification
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={isSubscribed}
                      onCheckedChange={async (checked) => {
                        try {
                          if (checked) {
                            await subscribe();
                            toast.success("Push notifications enabled");
                          } else {
                            await unsubscribe();
                            toast.success("Push notifications disabled");
                          }
                        } catch (error) {
                          if (error instanceof Error && error.message === 'Permission denied') {
                            toast.error("Permission denied");
                          } else {
                            toast.error("Failed to update push notifications");
                          }
                        }
                      }}
                      disabled={isLoading || !isSupported || permission === 'denied'}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* AI & Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI & Smart Features
              </CardTitle>
              <CardDescription>
                Enable intelligent task scheduling and suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Scheduling Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get smart recommendations for task timing
                  </p>
                </div>
                <Switch
                  checked={settings.aiSuggestions}
                  onCheckedChange={async (checked) => {
                    try {
                      await updateSettings({ aiSuggestions: checked });
                      toast.success("Settings updated");
                    } catch (error) {
                      toast.error("Failed to update settings");
                    }
                  }}
                />
              </div>

              {settings.aiSuggestions && (
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                  <p className="text-sm">
                    💡 <strong>AI Suggestion:</strong> Based on your patterns, consider
                    scheduling high-priority academic tasks in the morning when you're
                    most productive.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how Taskly looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark mode toggle in the top navigation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Preferences
              </CardTitle>
              <CardDescription>
                Adjust calendar display settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weekStart">Week Starts On</Label>
                <Select
                  value={settings.weekStartsOn.toString()}
                  onValueChange={async (value) => {
                    try {
                      await updateSettings({ weekStartsOn: parseInt(value) as 0 | 1 });
                      toast.success("Settings updated");
                    } catch (error) {
                      toast.error("Failed to update settings");
                    }
                  }}
                >
                  <SelectTrigger id="weekStart">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions - use with caution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Sign Out & Clear Data</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign you out and your data will remain stored in your account.
                      You can sign back in anytime to access your tasks.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
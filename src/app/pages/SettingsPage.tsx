import { useState } from "react";
import { useTaskAPI } from "../hooks/useTaskAPI";
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
  const { settings, updateSettings } = useTaskAPI();
  const { signOut, user } = useAuth();
  const [displayName, setDisplayName] = useState(settings?.displayName || "");
  const [email, setEmail] = useState(settings?.email || user?.email || "");

  const handleSaveProfile = async () => {
    try {
      await updateSettings({ displayName, email });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
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

          {/* Notifications */}
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for upcoming tasks
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={async (checked) => {
                    try {
                      await updateSettings({ notifications: checked });
                      toast.success("Settings updated");
                    } catch (error) {
                      toast.error("Failed to update settings");
                    }
                  }}
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
                <Switch defaultChecked />
              </div>
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
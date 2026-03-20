import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { Task, UserProgress, UserSettings } from "../types/task";
import { useAuth } from "../contexts/AuthContext";
import { useLoading } from "../contexts/LoadingContext";

const API_URL = "http://127.0.0.1:8000/api";

interface NotificationSettings {
  notifications_enabled: boolean;
  task_completed: boolean;
  task_reminders: boolean;
  pet_updates: boolean;
  ai_suggestions: boolean;
  daily_reminders: boolean;
}

export function useTaskAPI() {

  const { getAccessToken, user } = useAuth();
  const { setLoading } = useLoading();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);

  const [loading, setLocalLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());

  const getAuthHeaders = useCallback(() => {
    const token = getAccessToken();
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };
  }, [getAccessToken]);

  // ========================= SYNC =========================

  const syncData = useCallback(async () => {
    if (!user) return;

    try {
      setLocalLoading(true);

      const headers = getAuthHeaders();

      const response = await fetch(API_URL + "/tasks/", { headers });
      const data = await response.json();

      const progressResponse = await fetch(API_URL + "/progress/", { headers });
      const progressData = progressResponse.ok ? await progressResponse.json() : null;

      const notifResponse = await fetch(API_URL + "/notifications/settings/", { headers });
      const notifData = notifResponse.ok ? await notifResponse.json() : null;

      flushSync(() => {
        setTasks(data);
        setProgress(progressData);
        setNotificationSettings(notifData);
      });

      setSettings({
        displayName: user?.email?.split("@")[0] || "User",
        email: user?.email || "",
        avatar: "",
        theme: "light",
        notifications: true,
        aiSuggestions: true,
        weekStartsOn: 0,
      });

    } catch {
      setIsOfflineMode(true);
    } finally {
      setLocalLoading(false);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    if (user) syncData();
  }, [user, syncData]);

  // ========================= RELOAD HELPER =========================

  const triggerReloadWithLoading = () => {
    localStorage.setItem(
      "global-loading",
      JSON.stringify({ startTime: Date.now() })
    );

    window.location.reload();
  };

  // ========================= CRUD =========================

  const addTask = async (task: Omit<Task, "id" | "createdAt"> & { image?: File | null }) => {
    setLoading(true);

    try {
      const formData = new FormData();

      // Add all task fields to FormData
      Object.entries(task).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'image' && value instanceof File) {
            formData.append('image', value);
          } else if (key !== 'image') {
            formData.append(key, String(value));
          }
        }
      });

      const response = await fetch(API_URL + "/tasks/", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + getAccessToken(),
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      triggerReloadWithLoading();

    } catch (error) {
      console.error("Error adding task:", error);
      setLoading(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setLoading(true);

    try {
      await fetch(API_URL + "/tasks/" + id + "/", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      triggerReloadWithLoading();

    } catch (error) {
      console.error("Error updating task:", error);
      setLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    setLoading(true);

    try {
      await fetch(API_URL + "/tasks/" + id + "/", {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      triggerReloadWithLoading();

    } catch (error) {
      console.error("Error deleting task:", error);
      setLoading(false);
    }
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (pendingToggleIds.has(id)) return;

    setPendingToggleIds(prev => new Set(prev).add(id));
    setLoading(true);

    try {
      await fetch(API_URL + "/tasks/" + id + "/", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ completed: !task.completed })
      });

      triggerReloadWithLoading();

    } catch (error) {
      console.error("Error toggling task:", error);
      setPendingToggleIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    setSettings(prev => prev ? { ...prev, ...updates } : null);
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch(API_URL + "/notifications/settings/", {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data);
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    }
  };

  const updateNotificationSettings = async (updates: Partial<NotificationSettings>) => {
    try {
      const response = await fetch(API_URL + "/notifications/settings/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data);
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      throw error;
    }
  };

  return {
    tasks,
    progress,
    settings,
    notificationSettings,
    loading,
    isOfflineMode,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    syncData,
    updateSettings,
    fetchNotificationSettings,
    updateNotificationSettings
  };
}
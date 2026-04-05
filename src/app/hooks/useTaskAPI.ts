import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { Task, UserProgress, UserSettings } from "../types/task";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../lib/api";

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
        const processedTasks = (Array.isArray(data) ? data : []).map((task: any) => {
          if ((task.category === 'work' || task.category === 'work_schedule') && task.description) {
            try {
              const parsed = JSON.parse(task.description);

              if (parsed && parsed.schedule) {
                const schedule = parsed.schedule;
                return {
                  ...task,
                  description: parsed.text || "",
                  work_days: schedule.work_days || [],
                  start_time: schedule.start_time || "",
                  end_time: schedule.end_time || "",
                  work_type: schedule.work_type || "",
                };
              }

              return { ...task, ...parsed };
            } catch {
              return task;
            }
          }
          return task;
        });
        setTasks(processedTasks);
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
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) {
      setLocalLoading(false);
    }
  }, [user]);

  // ========================= RELOAD HELPER =========================

  const triggerReloadWithLoading = () => {
    localStorage.setItem(
      "global-loading",
      JSON.stringify({ startTime: Date.now() })
    );

    window.location.reload();
  };

  // ========================= CRUD =========================

  const addTask = async (task: Omit<Task, "id" | "createdAt"> & { image?: File | null }, reload = true) => {
    try {
      const taskToSend = { ...task };

      // For work tasks, serialize schedule data into description
      if (task.category === 'work' || task.category === 'work_schedule') {
        const existingDescription = task.description || "";

        try {
          const parsed = JSON.parse(existingDescription);

          if (parsed && parsed.schedule) {
            taskToSend.description = existingDescription;
          } else {
            const scheduleData = {
              work_days: task.work_days,
              start_time: task.start_time,
              end_time: task.end_time,
              work_type: task.work_type,
            };
            taskToSend.description = JSON.stringify({ text: "", schedule: scheduleData });
          }
        } catch {
          const scheduleData = {
            work_days: task.work_days,
            start_time: task.start_time,
            end_time: task.end_time,
            work_type: task.work_type,
          };
          taskToSend.description = JSON.stringify({ text: "", schedule: scheduleData });
        }
      }

      const formData = new FormData();

      // Add all task fields to FormData
      Object.entries(taskToSend).forEach(([key, value]) => {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'Error adding task');
      }

      if (reload) {
        triggerReloadWithLoading();
      }

      return data;
    } catch (error) {
      console.error("Error adding task:", error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updatesToSend = { ...updates };

      // For work tasks, serialize schedule data into description
      if (updates.category === 'work' || (updates.work_days || updates.start_time || updates.end_time || updates.work_type)) {
        const scheduleData = {
          work_days: updates.work_days,
          start_time: updates.start_time,
          end_time: updates.end_time,
          work_type: updates.work_type,
        };
        updatesToSend.description = JSON.stringify(scheduleData);
      }

      await fetch(API_URL + "/tasks/" + id + "/", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatesToSend)
      });

      triggerReloadWithLoading();

    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(API_URL + "/tasks/" + id + "/", {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      triggerReloadWithLoading();

    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (pendingToggleIds.has(id)) return;

    setPendingToggleIds(prev => new Set(prev).add(id));

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

  const getSchedulingSuggestion = async (task: any) => {
    try {
      const response = await fetch(API_URL + "/tasks/schedule_suggestion/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(task)
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error getting scheduling suggestion:", error);
      return null;
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
    updateNotificationSettings,
    getSchedulingSuggestion
  };
}
import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { Task, UserProgress, UserSettings } from "../types/task";
import { useAuth } from "../contexts/AuthContext";
import { getApiUrl } from "../lib/apiUrl";
import { OfflineStorage } from "../utils/offlineStorage";
import { SyncService } from "../utils/syncService";
import { NotificationScheduler } from "../utils/notificationScheduler";

const API_URL = getApiUrl();

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
  const [isOfflineMode, setIsOfflineMode] = useState(!SyncService.isOnline());
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = getAccessToken();
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };
  }, [getAccessToken]);

  // ========================= SYNC =========================

  // Load from local storage first for instant UI
  useEffect(() => {
    const loadInitialData = async () => {
      const localTasks = await OfflineStorage.getTasks();
      const localProgress = await OfflineStorage.getUserData();

      if (localTasks && localTasks.length > 0) {
        setTasks(Array.isArray(localTasks) ? localTasks : []);
        setProgress(localProgress);
        setLocalLoading(false);
      }

      // Initialize notifications without blocking
      NotificationScheduler.initialize().then(() => {
        if (localTasks.length > 0) {
          NotificationScheduler.rescheduleAllTasks(localTasks).catch(err => {
            console.error('Failed to reschedule notifications:', err);
          });
        }
      }).catch(err => {
        console.error('Failed to initialize notifications:', err);
      });

      const pendingActions = await OfflineStorage.getPendingActions();
      setPendingSyncCount(pendingActions.length);
    };

    loadInitialData();
  }, []);

  // Reload tasks from localStorage when window regains focus (Android back navigation)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused - reloading tasks from localStorage');
      const localTasks = OfflineStorage.getTasks();
      setTasks(Array.isArray(localTasks) ? localTasks : []);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen to online/offline status
  useEffect(() => {
    const handleOnlineStatus = (isOnline: boolean) => {
      console.log('Online status changed:', isOnline);
      setIsOfflineMode(!isOnline);
      if (isOnline && user) {
        // Auto-sync when coming back online with a small delay
        setTimeout(() => {
          console.log('Auto-syncing after coming online...');
          syncData();
        }, 1000);
      }
    };

    const unsubscribe = SyncService.addOnlineStatusListener(handleOnlineStatus);

    // Check initial online status
    const initialOnline = SyncService.isOnline();
    setIsOfflineMode(!initialOnline);
    console.log('Initial online status:', initialOnline);

    return unsubscribe;
  }, [user]);

  const syncData = useCallback(async () => {
    if (!user) return;

    try {
      setLocalLoading(true);

      if (SyncService.isOnline()) {
        console.log('Starting sync with backend...');
        // Sync with backend
        const syncResult = await SyncService.syncWithBackend(getAccessToken);
        console.log("Sync result:", syncResult);

        if (syncResult.success) {
          // Load synced data from local storage
          const localTasks = await OfflineStorage.getTasks();
          const localProgress = await OfflineStorage.getUserData();

          flushSync(() => {
            const processedTasks = (Array.isArray(localTasks) ? localTasks : []).map((task: any) => {
              if ((task.category === 'work' || task.category === 'work_schedule') && task.description) {
                try {
                  const parsed = JSON.parse(task.description);
                  if (parsed && parsed.schedule) {
                    const schedule = parsed.schedule;
                    let workDays = schedule.work_days || [];
                    // Ensure work_days is always an array
                    if (typeof workDays === 'string') {
                      try {
                        workDays = JSON.parse(workDays);
                      } catch {
                        workDays = [];
                      }
                    }
                    if (!Array.isArray(workDays)) {
                      workDays = [];
                    }
                    return {
                      ...task,
                      description: parsed.text || "",
                      work_days: workDays,
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
            setProgress(localProgress);
          });

          // Reschedule notifications after sync
          const localTasksAfterSync = await OfflineStorage.getTasks();
          NotificationScheduler.rescheduleAllTasks(localTasksAfterSync).catch(err => {
            console.error('Failed to reschedule after sync:', err);
          });

          const pendingActions = await OfflineStorage.getPendingActions();
          setPendingSyncCount(pendingActions.length);
          setIsOfflineMode(false);
        } else {
          console.warn('Sync failed, using local data');
          // Fall back to local storage
          const localTasks = await OfflineStorage.getTasks();
          const localProgress = await OfflineStorage.getUserData();
          setTasks(localTasks);
          setProgress(localProgress);
        }
      } else {
        console.log('Offline mode - using local storage');
        // Offline mode - use local storage
        const localTasks = await OfflineStorage.getTasks();
        const localProgress = await OfflineStorage.getUserData();
        setTasks(Array.isArray(localTasks) ? localTasks : []);
        setProgress(localProgress);
        setIsOfflineMode(true);
      }

      setSettings({
        displayName: user?.email?.split("@")[0] || "User",
        email: user?.email || "",
        avatar: "",
        theme: "light",
        notifications: true,
        aiSuggestions: true,
        weekStartsOn: 0,
      });

    } catch (error) {
      console.error("Sync error:", error);
      // Fall back to local storage
      const localTasks = await OfflineStorage.getTasks();
      const localProgress = await OfflineStorage.getUserData();
      setTasks(Array.isArray(localTasks) ? localTasks : []);
      setProgress(localProgress);
      setIsOfflineMode(true);
    } finally {
      setLocalLoading(false);
    }
  }, [user, getAccessToken]);

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
    setActionLoading(true);
    try {
      if (isOfflineMode || !SyncService.isOnline()) {
        // Offline mode - save locally
        const newTask = await SyncService.createTaskOffline(task as any);
        setTasks(prev => [...prev, newTask]);
        const pendingActions = await OfflineStorage.getPendingActions();
        setPendingSyncCount(pendingActions.length);

        // Schedule notifications for the new task
        NotificationScheduler.scheduleTaskReminders(newTask).catch(err => {
          console.error('Failed to schedule notifications:', err);
        });

        return newTask;
      }

      // Online mode - save to backend
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
    } finally {
      setActionLoading(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setActionLoading(true);
    try {
      if (isOfflineMode || !SyncService.isOnline()) {
        // Offline mode - save locally
        await SyncService.updateTaskOffline(id, updates);
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        const pendingActions = await OfflineStorage.getPendingActions();
        setPendingSyncCount(pendingActions.length);

        // Reschedule notifications if due date or completion status changed
        if (updates.dueDate || updates.completed !== undefined) {
          const updatedTask = tasks.find(t => t.id === id);
          if (updatedTask) {
            if (updates.completed) {
              NotificationScheduler.cancelTaskReminders(id).catch(err => {
                console.error('Failed to cancel notifications:', err);
              });
              // Send completion notification
              NotificationScheduler.sendImmediateNotification(
                '🎉 Task Completed!',
                `Great job completing "${updatedTask.title}"!`,
                { type: 'task_completed', taskId: id }
              ).catch(err => {
                console.error('Failed to send completion notification:', err);
              });
            } else {
              NotificationScheduler.scheduleTaskReminders({ ...updatedTask, ...updates } as Task).catch(err => {
                console.error('Failed to reschedule notifications:', err);
              });
            }
          }
        }

        // Wait for UI to update before fading loading
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      // Online mode - save to backend
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

      const response = await fetch(API_URL + "/tasks/" + id + "/", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatesToSend)
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Update UI immediately
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

      // Wait for UI to update before fading loading
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    setActionLoading(true);
    try {
      if (isOfflineMode || !SyncService.isOnline()) {
        // Offline mode - delete locally
        await SyncService.deleteTaskOffline(id);
        setTasks(prev => prev.filter(t => t.id !== id));
        const pendingActions = await OfflineStorage.getPendingActions();
        setPendingSyncCount(pendingActions.length);

        // Cancel notifications for deleted task
        NotificationScheduler.cancelTaskReminders(id).catch(err => {
          console.error('Failed to cancel notifications:', err);
        });

        // Wait for UI to update before fading loading
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      // Online mode - delete from backend
      const response = await fetch(API_URL + "/tasks/" + id + "/", {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Update UI immediately
      setTasks(prev => prev.filter(t => t.id !== id));

      // Wait for UI to update before fading loading
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const toggleTaskComplete = async (id: string) => {
    console.log('toggleTaskComplete called for task:', id);
    const task = tasks.find(t => t.id === id);
    if (!task) {
      console.log('Task not found:', id);
      return;
    }

    if (pendingToggleIds.has(id)) {
      console.log('Task already pending:', id);
      return;
    }

    const updates = { completed: !task.completed };
    console.log('Toggling task completion:', { id, from: task.completed, to: updates.completed });

    // Update localStorage immediately BEFORE updating state
    await OfflineStorage.updateTask(id, updates);
    console.log('LocalStorage updated immediately');

    // Add to pending sync queue immediately (both online and offline)
    await OfflineStorage.addPendingAction({
      type: 'UPDATE',
      entity: 'task',
      data: { id, ...updates },
    });
    const pendingActions = await OfflineStorage.getPendingActions();
    setPendingSyncCount(pendingActions.length);
    console.log('Added to pending sync queue');

    // Verify localStorage update
    const verifyTasks = await OfflineStorage.getTasks();
    const verifyTask = verifyTasks.find(t => t.id === id);
    console.log('Verified localStorage:', verifyTask?.completed);

    // Force re-read from localStorage to ensure consistency
    const updatedTasks = await OfflineStorage.getTasks();
    flushSync(() => {
      setTasks(updatedTasks);
    });
    console.log('UI updated from localStorage');

    setActionLoading(true);
    setPendingToggleIds(prev => new Set(prev).add(id));

    try {
      if (isOfflineMode || !SyncService.isOnline()) {
        console.log('Offline mode - will sync when online');
        setPendingToggleIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        // Handle notifications
        if (updates.completed) {
          NotificationScheduler.cancelTaskReminders(id).catch(err => {
            console.error('Failed to cancel notifications:', err);
          });
          NotificationScheduler.sendImmediateNotification(
            '🎉 Task Completed!',
            `Great job completing "${task.title}"!`,
            { type: 'task_completed', taskId: id }
          ).catch(err => {
            console.error('Failed to send completion notification:', err);
          });
        } else {
          NotificationScheduler.scheduleTaskReminders(task).catch(err => {
            console.error('Failed to reschedule notifications:', err);
          });
        }

        // Brief delay for loading indicator
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Offline toggle complete');
        return;
      }

      console.log('Online mode - updating backend immediately');
      // Online mode - update backend immediately
      const response = await fetch(API_URL + "/tasks/" + id + "/", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        console.error('Backend update failed:', response.status);
        // Keep in pending queue for retry, but revert UI
        const revertedTasks = await OfflineStorage.getTasks();
        flushSync(() => {
          setTasks(revertedTasks);
        });
        throw new Error('Failed to toggle task');
      }

      console.log('Backend update successful - removing from pending queue');
      // Remove from pending queue on success
      const pendingActionsAfter = await OfflineStorage.getPendingActions();
      const actionToRemove = pendingActionsAfter.find(
        a => a.type === 'UPDATE' && a.entity === 'task' && a.data.id === id
      );
      if (actionToRemove) {
        await OfflineStorage.removePendingAction(actionToRemove.id);
        const updatedPending = await OfflineStorage.getPendingActions();
        setPendingSyncCount(updatedPending.length);
      }

      // Update streak if task was completed (not uncompleted)
      if (updates.completed) {
        try {
          await fetch(API_URL + "/streak/update/", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({})
          });
          console.log('Streak updated successfully');
        } catch (streakError) {
          console.error('Failed to update streak:', streakError);
          // Don't throw - streak update failure shouldn't block task completion
        }
      }

      setPendingToggleIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Brief delay for loading indicator
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('Online toggle complete');
      triggerReloadWithLoading();

    } catch (error) {
      console.error("Error toggling task:", error);
      setPendingToggleIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      throw error;
    } finally {
      setActionLoading(false);
      console.log('Toggle action complete, loading set to false');
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

  const refreshFromLocalStorage = useCallback(async () => {
    console.log('Manual refresh - reloading from localStorage');
    const localTasks = await OfflineStorage.getTasks();
    const localProgress = await OfflineStorage.getUserData();
    flushSync(() => {
      setTasks(Array.isArray(localTasks) ? localTasks : []);
      setProgress(localProgress);
    });
    const pendingActions = await OfflineStorage.getPendingActions();
    setPendingSyncCount(pendingActions.length);
  }, []);

  return {
    tasks,
    progress,
    settings,
    notificationSettings,
    loading,
    isOfflineMode,
    pendingSyncCount,
    actionLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    syncData,
    updateSettings,
    fetchNotificationSettings,
    updateNotificationSettings,
    getSchedulingSuggestion,
    refreshFromLocalStorage
  };
}
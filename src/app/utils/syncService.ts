import { OfflineStorage, PendingAction } from "./offlineStorage";
import { Task } from "../types/task";
import { getApiUrl } from "../lib/apiUrl";

const API_URL = getApiUrl();

export class SyncService {
  private static syncInProgress = false;
  private static onlineStatusListeners: Array<(isOnline: boolean) => void> = [];

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static addOnlineStatusListener(callback: (isOnline: boolean) => void): () => void {
    this.onlineStatusListeners.push(callback);
    return () => {
      this.onlineStatusListeners = this.onlineStatusListeners.filter((cb) => cb !== callback);
    };
  }

  static notifyOnlineStatusChange(isOnline: boolean): void {
    this.onlineStatusListeners.forEach((callback) => callback(isOnline));
  }

  static async syncWithBackend(getAccessToken: () => string | null): Promise<{
    success: boolean;
    synced: number;
    failed: number;
  }> {
    if (this.syncInProgress) {
      console.log("Sync already in progress");
      return { success: false, synced: 0, failed: 0 };
    }

    if (!this.isOnline()) {
      console.log("Cannot sync: offline");
      return { success: false, synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let syncedCount = 0;
    let failedCount = 0;

    try {
      const token = getAccessToken();
      if (!token) {
        console.log("Cannot sync: no auth token");
        return { success: false, synced: 0, failed: 0 };
      }

      // Step 1: Pull latest data from backend
      await this.pullFromBackend(token);

      // Step 2: Push pending local changes to backend
      const pendingActions = await OfflineStorage.getPendingActions();
      console.log(`Syncing ${pendingActions.length} pending actions`);

      for (const action of pendingActions) {
        try {
          await this.executePendingAction(action, token);
          await OfflineStorage.removePendingAction(action.id);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          failedCount++;
        }
      }

      // Step 3: Pull again to get any server-side changes
      await this.pullFromBackend(token);

      await OfflineStorage.setLastSyncTime(Date.now());
      console.log(`Sync completed: ${syncedCount} synced, ${failedCount} failed`);

      return { success: true, synced: syncedCount, failed: failedCount };
    } catch (error) {
      console.error("Sync failed:", error);
      return { success: false, synced: syncedCount, failed: failedCount };
    } finally {
      this.syncInProgress = false;
    }
  }

  private static async pullFromBackend(token: string): Promise<void> {
    try {
      // Fetch tasks
      const tasksResponse = await fetch(`${API_URL}/tasks/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        await OfflineStorage.saveTasks(tasks);
      }

      // Fetch work schedules
      const schedulesResponse = await fetch(`${API_URL}/work-schedules/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (schedulesResponse.ok) {
        const schedules = await schedulesResponse.json();
        await OfflineStorage.saveWorkSchedules(schedules);
      }

      // Fetch user progress
      const progressResponse = await fetch(`${API_URL}/progress/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (progressResponse.ok) {
        const progress = await progressResponse.json();
        await OfflineStorage.saveUserData(progress);
      }
    } catch (error) {
      console.error("Failed to pull from backend:", error);
      throw error;
    }
  }

  private static async executePendingAction(action: PendingAction, token: string): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    switch (action.type) {
      case "CREATE":
        if (action.entity === "task") {
          const response = await fetch(`${API_URL}/tasks/`, {
            method: "POST",
            headers,
            body: JSON.stringify(action.data),
          });

          if (response.ok) {
            const createdTask = await response.json();
            // Replace temp ID with real ID
            if (action.localId && OfflineStorage.isTempId(action.localId)) {
              await OfflineStorage.deleteTask(action.localId);
              await OfflineStorage.addTask(createdTask);
            }
          } else {
            throw new Error(`Failed to create task: ${response.statusText}`);
          }
        } else if (action.entity === "schedule") {
          const response = await fetch(`${API_URL}/work-schedules/`, {
            method: "POST",
            headers,
            body: JSON.stringify(action.data),
          });

          if (response.ok) {
            const createdSchedule = await response.json();
            // Replace temp ID with real ID
            if (action.localId && OfflineStorage.isTempId(action.localId)) {
              const schedules = await OfflineStorage.getWorkSchedules();
              const filtered = schedules.filter((s) => s.id !== action.localId);
              filtered.push(createdSchedule);
              await OfflineStorage.saveWorkSchedules(filtered);
            }
          } else {
            throw new Error(`Failed to create schedule: ${response.statusText}`);
          }
        }
        break;

      case "UPDATE":
        if (action.entity === "task") {
          const taskId = action.data.id;
          if (OfflineStorage.isTempId(taskId)) {
            // Can't update a task that doesn't exist on server yet
            console.warn(`Skipping update for temp task ${taskId}`);
            return;
          }

          const response = await fetch(`${API_URL}/tasks/${taskId}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(action.data),
          });

          if (!response.ok) {
            throw new Error(`Failed to update task: ${response.statusText}`);
          }
        } else if (action.entity === "schedule") {
          const scheduleId = action.data.id;
          if (OfflineStorage.isTempId(scheduleId)) {
            console.warn(`Skipping update for temp schedule ${scheduleId}`);
            return;
          }

          const response = await fetch(`${API_URL}/work-schedules/${scheduleId}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(action.data),
          });

          if (!response.ok) {
            throw new Error(`Failed to update schedule: ${response.statusText}`);
          }
        }
        break;

      case "DELETE":
        if (action.entity === "task") {
          const taskId = action.data.id;
          if (OfflineStorage.isTempId(taskId)) {
            // Just remove from local storage
            await OfflineStorage.deleteTask(taskId);
            return;
          }

          const response = await fetch(`${API_URL}/tasks/${taskId}/`, {
            method: "DELETE",
            headers,
          });

          if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to delete task: ${response.statusText}`);
          }
        } else if (action.entity === "schedule") {
          const scheduleId = action.data.id;
          if (OfflineStorage.isTempId(scheduleId)) {
            // Just remove from local storage
            const schedules = await OfflineStorage.getWorkSchedules();
            const filtered = schedules.filter((s) => s.id !== scheduleId);
            await OfflineStorage.saveWorkSchedules(filtered);
            return;
          }

          const response = await fetch(`${API_URL}/work-schedules/${scheduleId}/`, {
            method: "DELETE",
            headers,
          });

          if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to delete schedule: ${response.statusText}`);
          }
        }
        break;
    }
  }

  static async createTaskOffline(task: Omit<Task, "id">): Promise<Task> {
    const tempId = OfflineStorage.generateTempId();
    const newTask: Task = {
      ...task,
      id: tempId,
    } as Task;

    await OfflineStorage.addTask(newTask);
    await OfflineStorage.addPendingAction({
      type: "CREATE",
      entity: "task",
      data: task,
      localId: tempId,
    });

    return newTask;
  }

  static async updateTaskOffline(taskId: string, updates: Partial<Task>): Promise<void> {
    await OfflineStorage.updateTask(taskId, updates);
    await OfflineStorage.addPendingAction({
      type: "UPDATE",
      entity: "task",
      data: { id: taskId, ...updates },
    });
  }

  static async deleteTaskOffline(taskId: string): Promise<void> {
    await OfflineStorage.deleteTask(taskId);
    await OfflineStorage.addPendingAction({
      type: "DELETE",
      entity: "task",
      data: { id: taskId },
    });
  }

  // Work schedule offline methods
  static async createScheduleOffline(schedule: any): Promise<any> {
    const tempId = OfflineStorage.generateTempId();
    const newSchedule = {
      ...schedule,
      id: tempId,
    };

    const schedules = await OfflineStorage.getWorkSchedules();
    schedules.push(newSchedule);
    await OfflineStorage.saveWorkSchedules(schedules);

    await OfflineStorage.addPendingAction({
      type: "CREATE",
      entity: "schedule",
      data: schedule,
      localId: tempId,
    });

    return newSchedule;
  }

  static async updateScheduleOffline(scheduleId: string, updates: any): Promise<void> {
    const schedules = await OfflineStorage.getWorkSchedules();
    const index = schedules.findIndex((s) => s.id === scheduleId);
    if (index !== -1) {
      schedules[index] = { ...schedules[index], ...updates };
      await OfflineStorage.saveWorkSchedules(schedules);
    }

    await OfflineStorage.addPendingAction({
      type: "UPDATE",
      entity: "schedule",
      data: { id: scheduleId, ...updates },
    });
  }

  static async deleteScheduleOffline(scheduleId: string): Promise<void> {
    const schedules = await OfflineStorage.getWorkSchedules();
    const filtered = schedules.filter((s) => s.id !== scheduleId);
    await OfflineStorage.saveWorkSchedules(filtered);

    await OfflineStorage.addPendingAction({
      type: "DELETE",
      entity: "schedule",
      data: { id: scheduleId },
    });
  }
}

// Setup online/offline event listeners
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Network status: ONLINE");
    SyncService.notifyOnlineStatusChange(true);
  });

  window.addEventListener("offline", () => {
    console.log("Network status: OFFLINE");
    SyncService.notifyOnlineStatusChange(false);
  });
}

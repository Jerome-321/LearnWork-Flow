import { Task } from "../types/task";
import { Preferences } from "@capacitor/preferences";

const STORAGE_KEYS = {
  TASKS: "learnwork_tasks",
  PENDING_SYNC: "learnwork_pending_sync",
  LAST_SYNC: "learnwork_last_sync",
  USER_DATA: "learnwork_user_data",
  WORK_SCHEDULES: "learnwork_work_schedules",
};

export interface PendingAction {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  entity: "task" | "schedule";
  data: any;
  timestamp: number;
  localId?: string;
}

// Fallback to localStorage if Capacitor is not available (web)
const getStorageValue = async (key: string): Promise<string | null> => {
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch (error) {
    // Fallback to localStorage for web
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
};

const setStorageValue = async (key: string, value: string): Promise<void> => {
  try {
    await Preferences.set({ key, value });
  } catch (error) {
    // Fallback to localStorage for web
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error("Failed to save to storage:", err);
    }
  }
};

const removeStorageValue = async (key: string): Promise<void> => {
  try {
    await Preferences.remove({ key });
  } catch (error) {
    // Fallback to localStorage for web
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error("Failed to remove from storage:", err);
    }
  }
};

export class OfflineStorage {
  // Tasks
  static async getTasks(): Promise<Task[]> {
    try {
      const data = await getStorageValue(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await setStorageValue(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error("Failed to save tasks to local storage:", error);
    }
  }

  static async addTask(task: Task): Promise<void> {
    const tasks = await this.getTasks();
    tasks.push(task);
    await this.saveTasks(tasks);
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      await this.saveTasks(tasks);
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    await this.saveTasks(filtered);
  }

  // Pending sync actions
  static async getPendingActions(): Promise<PendingAction[]> {
    try {
      const data = await getStorageValue(STORAGE_KEYS.PENDING_SYNC);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async addPendingAction(action: Omit<PendingAction, "id" | "timestamp">): Promise<void> {
    const actions = await this.getPendingActions();
    const newAction: PendingAction = {
      ...action,
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    actions.push(newAction);
    try {
      await setStorageValue(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(actions));
    } catch (error) {
      console.error("Failed to save pending action:", error);
    }
  }

  static async removePendingAction(actionId: string): Promise<void> {
    const actions = await this.getPendingActions();
    const filtered = actions.filter((a) => a.id !== actionId);
    try {
      await setStorageValue(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
    } catch (error) {
      console.error("Failed to remove pending action:", error);
    }
  }

  static async clearPendingActions(): Promise<void> {
    try {
      await setStorageValue(STORAGE_KEYS.PENDING_SYNC, JSON.stringify([]));
    } catch (error) {
      console.error("Failed to clear pending actions:", error);
    }
  }

  // Sync metadata
  static async getLastSyncTime(): Promise<number | null> {
    try {
      const data = await getStorageValue(STORAGE_KEYS.LAST_SYNC);
      return data ? parseInt(data, 10) : null;
    } catch {
      return null;
    }
  }

  static async setLastSyncTime(timestamp: number): Promise<void> {
    try {
      await setStorageValue(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error("Failed to save last sync time:", error);
    }
  }

  // Work schedules
  static async getWorkSchedules(): Promise<any[]> {
    try {
      const data = await getStorageValue(STORAGE_KEYS.WORK_SCHEDULES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async saveWorkSchedules(schedules: any[]): Promise<void> {
    try {
      await setStorageValue(STORAGE_KEYS.WORK_SCHEDULES, JSON.stringify(schedules));
    } catch (error) {
      console.error("Failed to save work schedules:", error);
    }
  }

  // User data
  static async getUserData(): Promise<any> {
    try {
      const data = await getStorageValue(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async saveUserData(userData: any): Promise<void> {
    try {
      await setStorageValue(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save user data:", error);
    }
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    try {
      await Promise.all(
        Object.values(STORAGE_KEYS).map((key) => removeStorageValue(key))
      );
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }

  // Generate temporary ID for offline-created items
  static generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if ID is temporary
  static isTempId(id: string): boolean {
    return id.startsWith("temp_");
  }
}

import { useState, useEffect, useCallback } from "react";
import { WorkSchedule } from "../types/task";
import { useAuth } from "../contexts/AuthContext";
import { getApiUrl } from "../lib/apiUrl";
import { OfflineStorage } from "../utils/offlineStorage";
import { SyncService } from "../utils/syncService";

const API_URL = getApiUrl();

export function useWorkScheduleAPI() {
  const { getAccessToken } = useAuth();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!SyncService.isOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAccessToken()}`,
  }), [getAccessToken]);

  // Load from local storage first
  useEffect(() => {
    const loadInitialSchedules = async () => {
      const localSchedules = await OfflineStorage.getWorkSchedules();
      if (localSchedules.length > 0) {
        setSchedules(localSchedules);
      }
      const pendingActions = await OfflineStorage.getPendingActions();
      const schedulePendingCount = pendingActions.filter(a => a.entity === 'schedule').length;
      setPendingSyncCount(schedulePendingCount);
    };
    loadInitialSchedules();
  }, []);

  // Listen to online/offline status
  useEffect(() => {
    const handleOnlineStatus = (isOnline: boolean) => {
      setIsOfflineMode(!isOnline);
      if (isOnline) {
        // Auto-sync when coming back online
        setTimeout(() => {
          fetchSchedules();
        }, 1000);
      }
    };

    const unsubscribe = SyncService.addOnlineStatusListener(handleOnlineStatus);
    const initialOnline = SyncService.isOnline();
    setIsOfflineMode(!initialOnline);

    return unsubscribe;
  }, []);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      if (SyncService.isOnline()) {
        const response = await fetch(`${API_URL}/work-schedules/`, {
          method: "GET",
          headers: getHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          await OfflineStorage.saveWorkSchedules(data);
          setSchedules(data);
          setIsOfflineMode(false);
        } else {
          // Fallback to local
          const localSchedules = await OfflineStorage.getWorkSchedules();
          setSchedules(localSchedules);
        }
      } else {
        // Offline mode - use local storage
        const localSchedules = await OfflineStorage.getWorkSchedules();
        setSchedules(localSchedules);
        setIsOfflineMode(true);
      }
    } catch (error) {
      console.error("Error fetching work schedules", error);
      // Fallback to local storage
      const localSchedules = await OfflineStorage.getWorkSchedules();
      setSchedules(localSchedules);
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // Initial fetch
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = async (payload: Omit<WorkSchedule, "id" | "created_at" | "user">) => {
    try {
      if (isOfflineMode || !SyncService.isOnline()) {
        // Offline mode
        const newSchedule = await SyncService.createScheduleOffline(payload);
        setSchedules(prev => [...prev, newSchedule]);
        const pendingActions = await OfflineStorage.getPendingActions();
        const schedulePendingCount = pendingActions.filter(a => a.entity === 'schedule').length;
        setPendingSyncCount(schedulePendingCount);
        return newSchedule;
      }

      // Online mode
      const response = await fetch(`${API_URL}/work-schedules/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Could not save work schedule");
      }

      const newSchedule = await response.json();
      await fetchSchedules();
      return newSchedule;
    } catch (error) {
      console.error("Error adding schedule:", error);
      throw error;
    }
  };

  const updateSchedule = async (id: string, payload: Partial<WorkSchedule>) => {
    try {
      if (isOfflineMode || !SyncService.isOnline()) {
        // Offline mode
        await SyncService.updateScheduleOffline(id, payload);
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...payload } : s));
        const pendingActions = await OfflineStorage.getPendingActions();
        const schedulePendingCount = pendingActions.filter(a => a.entity === 'schedule').length;
        setPendingSyncCount(schedulePendingCount);
        return;
      }

      // Online mode
      const response = await fetch(`${API_URL}/work-schedules/${id}/`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Could not update work schedule");
      }

      await fetchSchedules();
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      if (isOfflineMode || !SyncService.isOnline()) {
        // Offline mode
        await SyncService.deleteScheduleOffline(id);
        setSchedules(prev => prev.filter(s => s.id !== id));
        const pendingActions = await OfflineStorage.getPendingActions();
        const schedulePendingCount = pendingActions.filter(a => a.entity === 'schedule').length;
        setPendingSyncCount(schedulePendingCount);
        return;
      }

      // Online mode
      const response = await fetch(`${API_URL}/work-schedules/${id}/`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Could not delete work schedule");
      }

      await fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
  };

  const suggestSchedule = async (payload: Omit<WorkSchedule, "id" | "created_at" | "user">) => {
    try {
      const response = await fetch(`${API_URL}/work-schedules/suggest/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Could not get suggestion");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting suggestion:", error);
      throw error;
    }
  };

  return {
    schedules,
    loading,
    isOfflineMode,
    pendingSyncCount,
    fetchSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    suggestSchedule,
  };
}

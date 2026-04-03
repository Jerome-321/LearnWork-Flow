import { useState, useEffect, useCallback } from "react";
import { WorkSchedule } from "../types/task";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function useWorkScheduleAPI() {
  const { getAccessToken } = useAuth();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAccessToken()}`,
  }), [getAccessToken]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/work-schedules/`, {
        method: "GET",
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching work schedules", error);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = async (payload: Omit<WorkSchedule, "id" | "created_at" | "user">) => {
    const response = await fetch(`${API_URL}/work-schedules/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Could not save work schedule");
    }

    await fetchSchedules();
  };

  const updateSchedule = async (id: string, payload: Partial<WorkSchedule>) => {
    const response = await fetch(`${API_URL}/work-schedules/${id}/`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Could not update work schedule");
    }

    await fetchSchedules();
  };

  const deleteSchedule = async (id: string) => {
    const response = await fetch(`${API_URL}/work-schedules/${id}/`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Could not delete work schedule");
    }

    await fetchSchedules();
  };

  const suggestSchedule = async (payload: Omit<WorkSchedule, "id" | "created_at" | "user">) => {
    const response = await fetch(`${API_URL}/work-schedules/suggest/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Could not get suggestion");
    }

    return await response.json();
  };

  return {
    schedules,
    loading,
    fetchSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    suggestSchedule,
  };
}

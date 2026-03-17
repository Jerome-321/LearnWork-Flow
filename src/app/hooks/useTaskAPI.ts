import { useState, useEffect, useCallback } from "react";
import { Task, UserProgress, UserSettings } from "../types/task";
import { useAuth } from "../contexts/AuthContext";

const API_URL = "http://127.0.0.1:8000/api";

const STORAGE_PREFIX = "taskly_";

const TASKS_KEY = (userId: string) => STORAGE_PREFIX + "tasks_" + userId;
const PROGRESS_KEY = (userId: string) => STORAGE_PREFIX + "progress_" + userId;
const SETTINGS_KEY = (userId: string) => STORAGE_PREFIX + "settings_" + userId;

export function useTaskAPI() {

  const { getAccessToken, user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());



  const getAuthHeaders = useCallback(() => {

    const token = getAccessToken();

    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };

  }, [getAccessToken]);



  // ✅ FIX #2: New function to fetch progress from backend
  const fetchProgress = useCallback(async () => {
    if (!user || isOfflineMode) return null;

    try {
      const headers = getAuthHeaders();
      const response = await fetch(API_URL + "/progress/", { headers });

      if (!response.ok) throw new Error("Failed to fetch progress");

      const progressData = await response.json();
      setProgress(progressData);
      saveToStorage({ progress: progressData });

      return progressData;
    } catch (err) {
      console.error("❌ Error fetching progress:", err);
      return null;
    }
  }, [user, getAuthHeaders, isOfflineMode]);



  const getDefaultProgress = (): UserProgress => ({
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    petLevel: 1,
    petStage: "egg",
    tasksCompleted: 0,
    goals: [],
  });



  const getDefaultSettings = (): UserSettings => ({
    displayName: user?.email?.split("@")[0] || "User",
    email: user?.email || "",
    avatar: "",
    theme: "light",
    notifications: true,
    aiSuggestions: true,
    weekStartsOn: 0,
  });



  const saveToStorage = (data: {
    tasks?: Task[],
    progress?: UserProgress,
    settings?: UserSettings
  }) => {

    if (!user) return;

    if (data.tasks)
      localStorage.setItem(TASKS_KEY(user.id), JSON.stringify(data.tasks));

    if (data.progress)
      localStorage.setItem(PROGRESS_KEY(user.id), JSON.stringify(data.progress));

    if (data.settings)
      localStorage.setItem(SETTINGS_KEY(user.id), JSON.stringify(data.settings));
  };



  const loadFromStorage = () => {

    if (!user)
      return {
        tasks: [],
        progress: getDefaultProgress(),
        settings: getDefaultSettings()
      };

    const storedTasks = localStorage.getItem(TASKS_KEY(user.id));
    const storedProgress = localStorage.getItem(PROGRESS_KEY(user.id));
    const storedSettings = localStorage.getItem(SETTINGS_KEY(user.id));

    return {
      tasks: storedTasks ? JSON.parse(storedTasks) : [],
      progress: storedProgress ? JSON.parse(storedProgress) : getDefaultProgress(),
      settings: storedSettings ? JSON.parse(storedSettings) : getDefaultSettings(),
    };

  };



  const syncData = useCallback(async () => {

    if (!user) return;

    try {

      setLoading(true);
      setError(null);
      setIsOfflineMode(false);

      const headers = getAuthHeaders();

      const response = await fetch(API_URL + "/tasks/", { headers });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();

      setTasks(data);

      // ✅ FIX #3: Actually fetch progress from backend instead of defaults
      const progressResponse = await fetch(API_URL + "/progress/", { headers });
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setProgress(progressData);
        saveToStorage({
          tasks: data,
          progress: progressData,
          settings: getDefaultSettings()
        });
      } else {
        setProgress(getDefaultProgress());
        saveToStorage({
          tasks: data,
          progress: getDefaultProgress(),
          settings: getDefaultSettings()
        });
      }

      setSettings(getDefaultSettings());

      console.log("✅ Connected to Django backend");

    } catch (err) {

      console.log("📱 Offline mode");

      setIsOfflineMode(true);

      const local = loadFromStorage();

      setTasks(local.tasks);
      setProgress(local.progress);
      setSettings(local.settings);

    } finally {

      setLoading(false);

    }

  }, [user, getAuthHeaders]);



  useEffect(() => {

    if (user) syncData();

    else {
      setTasks([]);
      setProgress(null);
      setSettings(null);
      setLoading(false);
    }

  }, [user, syncData]);

  // ✅ AUTO-SYNC #1: Polling for real-time updates every 7 seconds
  useEffect(() => {
    if (!user || isOfflineMode) return;

    // Store polling interval ID for cleanup
    let pollInterval: NodeJS.Timeout | null = null;

    // Function to perform periodic sync
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        try {
          const headers = getAuthHeaders();
          
          // ✅ Fetch tasks
          const tasksResponse = await fetch(API_URL + "/tasks/", { headers });
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            setTasks(tasksData);
            saveToStorage({ tasks: tasksData });
          }

          // ✅ Fetch progress
          const progressResponse = await fetch(API_URL + "/progress/", { headers });
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            setProgress(progressData);
            saveToStorage({ progress: progressData });
          }
        } catch (err) {
          console.log("⚠️  Polling sync failed, continuing with local data");
        }
      }, 7000); // Poll every 7 seconds
    };

    // Start polling after initial load
    startPolling();

    // ✅ Cleanup: stop polling on unmount or when offline
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [user, isOfflineMode, getAuthHeaders]);



  const addTask = async (task: Omit<Task, "id" | "createdAt">) => {

    try {

      const response = await fetch(API_URL + "/tasks/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(task)
      });

      const createdTask = await response.json();

      const updatedTasks = [...tasks, createdTask];

      setTasks(updatedTasks);
      saveToStorage({ tasks: updatedTasks });

      return createdTask;

    } catch {

      const newTask: Task = {
        id: crypto.randomUUID(),
        ...task,
        createdAt: new Date().toISOString(),
        completed: false
      };

      const updatedTasks = [...tasks, newTask];

      setTasks(updatedTasks);
      saveToStorage({ tasks: updatedTasks });

      return newTask;
    }
  };



  const updateTask = async (id: string, updates: Partial<Task>) => {

    try {

      const response = await fetch(API_URL + "/tasks/" + id + "/", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const updatedTask = await response.json();

      const updatedTasks = tasks.map(t =>
        t.id === id ? updatedTask : t
      );

      setTasks(updatedTasks);
      saveToStorage({ tasks: updatedTasks });

      return updatedTask;

    } catch {

      const updatedTasks = tasks.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );

      setTasks(updatedTasks);
      saveToStorage({ tasks: updatedTasks });

      return updatedTasks.find(t => t.id === id)!;
    }
  };



  const deleteTask = async (id: string) => {

    try {

      await fetch(API_URL + "/tasks/" + id + "/", {
        method: "DELETE",
        headers: getAuthHeaders()
      });

    } catch {}

    const updatedTasks = tasks.filter(t => t.id !== id);

    setTasks(updatedTasks);
    saveToStorage({ tasks: updatedTasks });
  };



  const toggleTaskComplete = async (id: string) => {

    const task = tasks.find(t => t.id === id);

    if (!task) return;

    // ✅ FIX #2: Prevent duplicate API calls for the same task
    if (pendingToggleIds.has(id)) {
      console.log("⏳ Toggle already in progress for task:", id);
      return;
    }

    // Mark this task as pending
    setPendingToggleIds(prev => new Set(prev).add(id));

    try {
      const result = await updateTask(id, { completed: !task.completed });
      
      // ✅ FIX #2: Re-fetch progress after toggling to update pet level/XP
      // Small delay to ensure backend has processed the update
      setTimeout(() => {
        fetchProgress();
      }, 150);

      return result;
    } catch (error) {
      console.error("❌ Failed to toggle task:", error);
      throw error;
    } finally {
      // Remove from pending set
      setPendingToggleIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };



  const analyzeTaskAI = async (
    title: string,
    description: string,
    category: TaskCategory,
    priority: string = "medium",
    dueDate: string = ""
  ) => {

    try {

      // ✅ IMPROVED: Pass priority and dueDate for smarter AI suggestions
      const response = await fetch(API_URL + "/ai/analyze/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          title, 
          description, 
          category,
          priority,
          dueDate
        })
      });

      if (!response.ok) throw new Error();

      return await response.json();

    } catch {

      console.log("⚠️  AI endpoint unavailable, using fallback");

      return null;
    }

  };



  const updateSettings = async (updates: Partial<UserSettings>) => {

    const updatedSettings = {
      ...(settings || getDefaultSettings()),
      ...updates
    };

    setSettings(updatedSettings);

    saveToStorage({ settings: updatedSettings });

    return updatedSettings;
  };



  return {
    tasks,
    progress,
    settings,
    loading,
    error,
    isOfflineMode,

    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    fetchProgress,

    analyzeTaskAI,

    updateSettings,
    syncData
  };

}

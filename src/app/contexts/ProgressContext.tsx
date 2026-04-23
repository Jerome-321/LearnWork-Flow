import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { UserProgress } from "../types/task";
import { useAuth } from "./AuthContext";
import { useLoading } from "./LoadingContext";
import { getApiUrl } from "../lib/apiUrl";

interface ProgressContextType {
  progress: UserProgress | null;
  loading: boolean;
  fetchProgress: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

interface ProgressProviderProps {
  children: ReactNode;
}

const API_URL = getApiUrl();

export function ProgressProvider({ children }: ProgressProviderProps) {
  const { getAccessToken, user } = useAuth();
  const { setLoading } = useLoading();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoadingState] = useState(true);
  
  // Track last sync to prevent excessive syncs
  const lastSyncTime = useRef<number>(0);
  const MIN_SYNC_INTERVAL = 30000; // 30 seconds minimum between syncs

  // ✅ Core function: Fetch progress from backend
  const fetchProgress = useCallback(async (showGlobal = false) => {
    if (showGlobal) {
      setLoading(true);
    }
    setLoadingState(true);

    if (!user) {
      if (showGlobal) setLoading(false);
      setLoadingState(false);
      return;
    }

    try {
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/progress/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch progress");
        return;
      }

      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      if (showGlobal) setLoading(false);
      setLoadingState(false);
    }
  }, [user, getAccessToken]);

  // ✅ Alias for explicit refresh calls
  const refreshProgress = useCallback(async () => {
    setLoadingState(true);
    await fetchProgress(true);
    setLoadingState(false);
  }, [fetchProgress]);

  // ✅ Call fetchProgress on user login
  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Auto-sync every 30 seconds for real-time updates (with debounce)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Only sync if minimum interval has passed since last sync
      if (now - lastSyncTime.current >= MIN_SYNC_INTERVAL) {
        lastSyncTime.current = now;
        fetchProgress();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchProgress]);

  const value: ProgressContextType = {
    progress,
    loading,
    fetchProgress,
    refreshProgress,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

// ✅ Custom hook to use progress context
export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}

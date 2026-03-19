import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { UserProgress } from "../types/task";
import { useAuth } from "./AuthContext";

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

const API_URL = "http://127.0.0.1:8000/api";

export function ProgressProvider({ children }: ProgressProviderProps) {
  const { getAccessToken, user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Core function: Fetch progress from backend
  const fetchProgress = useCallback(async () => {
    if (!user) {
      setLoading(false);
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
      setLoading(false);
    }
  }, [user, getAccessToken]);

  // ✅ Alias for explicit refresh calls
  const refreshProgress = useCallback(async () => {
    setLoading(true);
    await fetchProgress();
  }, [fetchProgress]);

  // ✅ Call fetchProgress on user login
  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user, fetchProgress]);

  // ✅ Auto-sync every 30 seconds for real-time updates
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchProgress();
    }, 30000); // 30 seconds

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

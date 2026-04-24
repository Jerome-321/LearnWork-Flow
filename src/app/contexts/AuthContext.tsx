import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLoading } from "./LoadingContext";
import { PushNotificationService } from "../utils/pushNotifications";
import { AndroidSyncService } from "../utils/androidSyncService";
import { getApiUrl } from "../lib/apiUrl";

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  hasCompletedSchedule: boolean;
  scheduleChecked: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ otp?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  refreshSession: () => Promise<void>;
  setHasCompletedSchedule: (completed: boolean) => void;
  resetPassword: (email: string) => Promise<void>;
}

const API_URL = getApiUrl();

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedSchedule, setHasCompletedSchedule] = useState(false);
  const [scheduleChecked, setScheduleChecked] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    const storedHasCompleted = localStorage.getItem("hasCompletedSchedule");

    if (token && storedUser) {
      setSession({ access_token: token });
      setUser(JSON.parse(storedUser));
      setHasCompletedSchedule(storedHasCompleted === "true");
      setScheduleChecked(true);
      
      // DISABLED: Initialize push notifications when user is authenticated
      // PushNotificationService.initialize(() => token);
      
      // Initialize Android background sync
      AndroidSyncService.initialize(() => localStorage.getItem("accessToken"));
    }

    setLoading(false);

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken" || e.key === "user" || e.key === "hasCompletedSchedule") {
        console.log('Storage changed from another tab:', e.key);
        const newToken = localStorage.getItem("accessToken");
        const newUser = localStorage.getItem("user");
        const newHasCompleted = localStorage.getItem("hasCompletedSchedule");

        if (newToken && newUser) {
          setSession({ access_token: newToken });
          setUser(JSON.parse(newUser));
          setHasCompletedSchedule(newHasCompleted === "true");
        } else {
          // User signed out in another tab
          setSession(null);
          setUser(null);
          setHasCompletedSchedule(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signIn = async (email: string, password: string) => {
    setGlobalLoading(true);
    try {
      console.log(" API_URL:", API_URL);
      console.log(" Attempting to sign in:", email);
      const response = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      console.log(" Response status:", response.status);
      const data = await response.json();
      console.log(" Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("hasCompletedSchedule", data.has_completed_schedule.toString());

      setSession({ access_token: data.access });
      setUser(data.user);
      setHasCompletedSchedule(data.has_completed_schedule);
      setScheduleChecked(true);
      
      // DISABLED: Initialize push notifications after successful login
      // PushNotificationService.initialize(() => data.access);
      
      // Initialize Android background sync
      AndroidSyncService.initialize(() => localStorage.getItem("accessToken"));
    } catch (error: any) {
      console.error(" Sign in error:", error);
      throw error;
    } finally {
      setGlobalLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<{ otp?: string }> => {
    setGlobalLoading(true);
    try {
      console.log("🔄 Attempting to register:", email);
      const response = await fetch(`${API_URL}/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: name || email,
          email: email,
          password: password,
        }),
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response headers:", Object.fromEntries(response.headers));

      const data = await response.json();
      console.log("📦 Response body:", data);

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Return the OTP for development/testing
      return { otp: data.otp };
    } finally {
      setGlobalLoading(false);
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    setGlobalLoading(true);
    try {
      const response = await fetch(`${API_URL}/verify-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed");
      }

      // OTP verified successfully - user can now sign in
    } finally {
      setGlobalLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setGlobalLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  const signOut = async () => {
    // DISABLED: Unregister push notifications before signing out
    // await PushNotificationService.unregister(getAccessToken);
    
    // Clear all local storage
    localStorage.clear();

    setSession(null);
    setUser(null);
    setHasCompletedSchedule(false);
    
    // Force reload to clear all state
    window.location.href = '/';
  };

  const refreshSession = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) return;

    setSession({ access_token: token });
  };

  const getAccessToken = () => {
    return localStorage.getItem("accessToken");
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    hasCompletedSchedule,
    scheduleChecked,
    signIn,
    signUp,
    verifyOTP,
    signOut,
    getAccessToken,
    refreshSession,
    setHasCompletedSchedule,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
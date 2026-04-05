import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLoading } from "./LoadingContext";

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  hasCompletedSchedule: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ otp?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  refreshSession: () => Promise<void>;
  setHasCompletedSchedule: (completed: boolean) => void;
}

const API_URL = "/api";

// Debug: Log the API URL being used
console.log("AuthContext API_URL:", API_URL);

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedSchedule, setHasCompletedSchedule] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    const storedHasCompleted = localStorage.getItem("hasCompletedSchedule");

    if (token && storedUser) {
      setSession({ access_token: token });
      setUser(JSON.parse(storedUser));
      setHasCompletedSchedule(storedHasCompleted === "true");
    }

    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setGlobalLoading(true);
    try {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("hasCompletedSchedule", data.has_completed_schedule.toString());

      setSession({ access_token: data.access });
      setUser(data.user);
      setHasCompletedSchedule(data.has_completed_schedule);
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

  const signOut = async () => {
    try {
      // Call backend logout endpoint to clear session
      await fetch("/api/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear frontend auth data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("hasCompletedSchedule");
      sessionStorage.clear();

      setSession(null);
      setUser(null);
      setHasCompletedSchedule(false);

      // Redirect to production URL
      window.location.href = "https://learnwork-flow-production.up.railway.app";
    }
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
    signIn,
    signUp,
    verifyOTP,
    signOut,
    getAccessToken,
    refreshSession,
    setHasCompletedSchedule,
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
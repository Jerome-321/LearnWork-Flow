import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLoading } from "./LoadingContext";

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  refreshSession: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || "https://learnwork-flow.onrender.com/api";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setSession({ access_token: token });
      setUser(JSON.parse(storedUser));
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

      setSession({ access_token: data.access });
      setUser(data.user);
    } finally {
      setGlobalLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setGlobalLoading(true);
    try {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      await signIn(email, password);
    } finally {
      setGlobalLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    setSession(null);
    setUser(null);
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
    signIn,
    signUp,
    signOut,
    getAccessToken,
    refreshSession,
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
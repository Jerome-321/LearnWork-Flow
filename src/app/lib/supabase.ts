import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

// Supabase configuration
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

// Create a singleton Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types for type safety
export type TaskCategory = "academic" | "work" | "personal";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
  completed: boolean;
  points: number;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProgress {
  userId: string;
  totalPoints: number;
  level: number;
  completedTasks: number;
  lastUpdated?: string;
}

// Database table names
export const TABLES = {
  TASKS: "tasks",
  USER_PROGRESS: "user_progress",
} as const;

// Helper function to get user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
};

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && projectId && projectId !== "YOUR_PROJECT_ID");
};

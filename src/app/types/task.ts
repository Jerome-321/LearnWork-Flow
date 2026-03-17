export type TaskCategory = "academic" | "work" | "personal";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  dueDate: string;
  priority: TaskPriority;
  completed: boolean;
  points: number;
  tags?: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  createdAt: string;
}

export interface UserProgress {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  petLevel: number;
  petStage: "egg" | "baby" | "teen" | "adult" | "master";
  tasksCompleted: number;
  goals: Goal[];
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  type: "tasks" | "streak" | "points";
  completed: boolean;
}

export interface UserSettings {
  displayName: string;
  email: string;
  avatar: string;
  theme: "light" | "dark" | "system";
  notifications: boolean;
  aiSuggestions: boolean;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
}

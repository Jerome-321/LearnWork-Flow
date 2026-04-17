export type TaskCategory = "academic" | "work" | "work_schedule" | "personal";
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
  image?: string;
  link?: string;
  tags?: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  createdAt: string;
  // Work schedule fields (stored in description as JSON for work tasks)
  work_days?: string[];
  start_time?: string;
  end_time?: string;
  work_type?: string;
}

export interface WorkSchedule {
  id: string;
  user?: string;
  job_title: string;
  work_days: string[];
  start_time: string;
  end_time: string;
  work_type: string;
  notes: string;
  created_at: string;
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

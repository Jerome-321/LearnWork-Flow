import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

// Taskly API Server - v1.0.1
// Last updated: 2026-02-25
// Fixed: JWT validation using anon client for user tokens

const app = new Hono();

// Create Supabase client helper
const getSupabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

const getSupabaseAnonClient = () => createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_ANON_KEY"),
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to verify user authentication
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  
  console.log("Auth middleware - Header present:", !!authHeader);
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Auth middleware - No valid auth header");
    return c.json({ error: "Unauthorized - No token provided", code: 401, message: "No Authorization header" }, 401);
  }

  const token = authHeader.split(" ")[1];
  console.log("Auth middleware - Token length:", token?.length || 0);
  
  // Create a client that uses the user's token directly
  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_ANON_KEY"),
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    console.log("Auth middleware - Verifying token with user context");
    const { data: { user }, error } = await userClient.auth.getUser();
    
    if (error) {
      console.log("Auth middleware - Auth error:", error.message);
      return c.json({ 
        error: "Unauthorized - Invalid token", 
        code: 401, 
        message: error.message,
        hint: "Please log out and log back in"
      }, 401);
    }
    
    if (!user) {
      console.log("Auth middleware - No user found");
      return c.json({ 
        error: "Unauthorized - No user", 
        code: 401, 
        message: "User not found"
      }, 401);
    }
    
    console.log("Auth middleware - Success! User:", user.id, user.email);
    c.set("userId", user.id);
    c.set("userEmail", user.email);
    await next();
  } catch (err) {
    console.log("Auth middleware - Exception:", err);
    return c.json({ 
      error: "Unauthorized - Auth failed", 
      code: 401, 
      message: String(err),
      details: "Exception during authentication"
    }, 401);
  }
};

// Helper functions for data keys
const getUserKey = (userId: string) => `user:${userId}`;
const getTasksKey = (userId: string) => `tasks:${userId}`;
const getProgressKey = (userId: string) => `progress:${userId}`;
const getSettingsKey = (userId: string) => `settings:${userId}`;

// Default data structures
const getDefaultProgress = () => ({
  totalPoints: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  petLevel: 1,
  petStage: "egg",
  tasksCompleted: 0,
  goals: [
    { id: "1", title: "Complete 10 tasks", target: 10, current: 0, type: "tasks", completed: false },
    { id: "2", title: "Maintain 7-day streak", target: 7, current: 0, type: "streak", completed: false },
    { id: "3", title: "Earn 500 points", target: 500, current: 0, type: "points", completed: false },
  ],
});

const getDefaultSettings = (email: string) => ({
  displayName: email?.split("@")[0] || "User",
  email: email || "",
  avatar: "",
  theme: "light",
  notifications: true,
  aiSuggestions: true,
  weekStartsOn: 0,
});

// Calculate pet stage based on points
const getPetStage = (points: number) => {
  if (points < 100) return "egg";
  if (points < 300) return "baby";
  if (points < 700) return "teen";
  if (points < 1500) return "adult";
  return "master";
};

// Check and update streak
const checkStreak = (progress: any) => {
  const today = new Date().toDateString();
  const lastCompleted = progress.lastCompletedDate
    ? new Date(progress.lastCompletedDate).toDateString()
    : null;

  if (!lastCompleted) return progress.currentStreak;
  if (lastCompleted === today) return progress.currentStreak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (lastCompleted === yesterdayStr) {
    return progress.currentStreak + 1;
  }

  return 1; // Reset streak
};

// Health check endpoint
app.get("/make-server-c3569cb3/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    version: "1.0.1" 
  });
});

// ==================== AUTH ROUTES ====================

// Sign up
app.post("/make-server-c3569cb3/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { name: name || email.split("@")[0] },
    });

    if (error) {
      console.log("Signup error:", error.message);
      return c.json({ error: error.message }, 400);
    }

    // Initialize user data
    const userId = data.user.id;
    await kv.set(getUserKey(userId), { id: userId, email, name: name || email.split("@")[0] });
    await kv.set(getTasksKey(userId), []);
    await kv.set(getProgressKey(userId), getDefaultProgress());
    await kv.set(getSettingsKey(userId), getDefaultSettings(email));

    return c.json({ 
      user: data.user,
      message: "User created successfully" 
    });
  } catch (err) {
    console.log("Signup exception:", err);
    return c.json({ error: "Signup failed" }, 500);
  }
});

// Sign in
app.post("/make-server-c3569cb3/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = getSupabaseAnonClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("Signin error:", error.message);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      session: data.session,
      user: data.user,
    });
  } catch (err) {
    console.log("Signin exception:", err);
    return c.json({ error: "Signin failed" }, 500);
  }
});

// ==================== USER ROUTES ====================

// Get current user profile
app.get("/make-server-c3569cb3/user/profile", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const userData = await kv.get(getUserKey(userId));
    
    if (!userData) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(userData);
  } catch (err) {
    console.log("Get profile error:", err);
    return c.json({ error: "Failed to get profile" }, 500);
  }
});

// ==================== TASK ROUTES ====================

// Get all tasks for user
app.get("/make-server-c3569cb3/tasks", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const tasks = await kv.get(getTasksKey(userId)) || [];
    
    return c.json({ tasks });
  } catch (err) {
    console.log("Get tasks error:", err);
    return c.json({ error: "Failed to get tasks" }, 500);
  }
});

// Create a new task
app.post("/make-server-c3569cb3/tasks", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const taskData = await c.req.json();
    
    const tasks = await kv.get(getTasksKey(userId)) || [];
    
    const newTask = {
      id: crypto.randomUUID(),
      ...taskData,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    
    tasks.push(newTask);
    await kv.set(getTasksKey(userId), tasks);
    
    return c.json({ task: newTask });
  } catch (err) {
    console.log("Create task error:", err);
    return c.json({ error: "Failed to create task" }, 500);
  }
});

// Update a task
app.put("/make-server-c3569cb3/tasks/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const taskId = c.req.param("id");
    const updates = await c.req.json();
    
    const tasks = await kv.get(getTasksKey(userId)) || [];
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
    
    if (taskIndex === -1) {
      return c.json({ error: "Task not found" }, 404);
    }
    
    const oldTask = tasks[taskIndex];
    const wasCompleted = oldTask.completed;
    const isNowCompleted = updates.completed !== undefined ? updates.completed : wasCompleted;
    
    // Update task
    tasks[taskIndex] = { ...oldTask, ...updates };
    await kv.set(getTasksKey(userId), tasks);
    
    // If task completion status changed, update progress
    if (!wasCompleted && isNowCompleted) {
      await updateProgressOnTaskComplete(userId, oldTask);
    } else if (wasCompleted && !isNowCompleted) {
      await updateProgressOnTaskUncomplete(userId, oldTask);
    }
    
    return c.json({ task: tasks[taskIndex] });
  } catch (err) {
    console.log("Update task error:", err);
    return c.json({ error: "Failed to update task" }, 500);
  }
});

// Delete a task
app.delete("/make-server-c3569cb3/tasks/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const taskId = c.req.param("id");
    
    const tasks = await kv.get(getTasksKey(userId)) || [];
    const filteredTasks = tasks.filter((t: any) => t.id !== taskId);
    
    if (filteredTasks.length === tasks.length) {
      return c.json({ error: "Task not found" }, 404);
    }
    
    await kv.set(getTasksKey(userId), filteredTasks);
    
    return c.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.log("Delete task error:", err);
    return c.json({ error: "Failed to delete task" }, 500);
  }
});

// Toggle task completion
app.post("/make-server-c3569cb3/tasks/:id/toggle", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const taskId = c.req.param("id");
    
    const tasks = await kv.get(getTasksKey(userId)) || [];
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
    
    if (taskIndex === -1) {
      return c.json({ error: "Task not found" }, 404);
    }
    
    const task = tasks[taskIndex];
    const wasCompleted = task.completed;
    task.completed = !wasCompleted;
    
    await kv.set(getTasksKey(userId), tasks);
    
    // Update progress based on completion status
    if (!wasCompleted) {
      await updateProgressOnTaskComplete(userId, task);
    } else {
      await updateProgressOnTaskUncomplete(userId, task);
    }
    
    // Get updated progress to return
    const progress = await kv.get(getProgressKey(userId));
    
    return c.json({ task, progress });
  } catch (err) {
    console.log("Toggle task error:", err);
    return c.json({ error: "Failed to toggle task" }, 500);
  }
});

// Helper: Update progress when task is completed
async function updateProgressOnTaskComplete(userId: string, task: any) {
  const progress = await kv.get(getProgressKey(userId)) || getDefaultProgress();
  
  const newStreak = checkStreak(progress);
  const newTotalPoints = progress.totalPoints + (task.points || 0);
  const newTasksCompleted = progress.tasksCompleted + 1;
  const newPetStage = getPetStage(newTotalPoints);
  
  // Update goals
  const updatedGoals = progress.goals.map((goal: any) => {
    let newCurrent = goal.current;
    if (goal.type === "tasks") newCurrent = newTasksCompleted;
    if (goal.type === "streak") newCurrent = newStreak;
    if (goal.type === "points") newCurrent = newTotalPoints;
    
    return {
      ...goal,
      current: newCurrent,
      completed: newCurrent >= goal.target,
    };
  });
  
  const updatedProgress = {
    ...progress,
    totalPoints: newTotalPoints,
    currentStreak: newStreak,
    longestStreak: Math.max(progress.longestStreak, newStreak),
    lastCompletedDate: new Date().toISOString(),
    petStage: newPetStage,
    petLevel: Math.floor(newTotalPoints / 100) + 1,
    tasksCompleted: newTasksCompleted,
    goals: updatedGoals,
  };
  
  await kv.set(getProgressKey(userId), updatedProgress);
}

// Helper: Update progress when task is uncompleted
async function updateProgressOnTaskUncomplete(userId: string, task: any) {
  const progress = await kv.get(getProgressKey(userId)) || getDefaultProgress();
  
  const newTotalPoints = Math.max(0, progress.totalPoints - (task.points || 0));
  const newTasksCompleted = Math.max(0, progress.tasksCompleted - 1);
  const newPetStage = getPetStage(newTotalPoints);
  
  const updatedProgress = {
    ...progress,
    totalPoints: newTotalPoints,
    tasksCompleted: newTasksCompleted,
    petStage: newPetStage,
    petLevel: Math.floor(newTotalPoints / 100) + 1,
  };
  
  await kv.set(getProgressKey(userId), updatedProgress);
}

// ==================== PROGRESS ROUTES ====================

// Get user progress
app.get("/make-server-c3569cb3/progress", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const progress = await kv.get(getProgressKey(userId)) || getDefaultProgress();
    
    return c.json({ progress });
  } catch (err) {
    console.log("Get progress error:", err);
    return c.json({ error: "Failed to get progress" }, 500);
  }
});

// Update user progress
app.put("/make-server-c3569cb3/progress", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const updates = await c.req.json();
    
    const progress = await kv.get(getProgressKey(userId)) || getDefaultProgress();
    const updatedProgress = { ...progress, ...updates };
    
    await kv.set(getProgressKey(userId), updatedProgress);
    
    return c.json({ progress: updatedProgress });
  } catch (err) {
    console.log("Update progress error:", err);
    return c.json({ error: "Failed to update progress" }, 500);
  }
});

// ==================== SETTINGS ROUTES ====================

// Get user settings
app.get("/make-server-c3569cb3/settings", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const userEmail = c.get("userEmail");
    const settings = await kv.get(getSettingsKey(userId)) || getDefaultSettings(userEmail);
    
    return c.json({ settings });
  } catch (err) {
    console.log("Get settings error:", err);
    return c.json({ error: "Failed to get settings" }, 500);
  }
});

// Update user settings
app.put("/make-server-c3569cb3/settings", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const userEmail = c.get("userEmail");
    const updates = await c.req.json();
    
    const settings = await kv.get(getSettingsKey(userId)) || getDefaultSettings(userEmail);
    const updatedSettings = { ...settings, ...updates };
    
    await kv.set(getSettingsKey(userId), updatedSettings);
    
    return c.json({ settings: updatedSettings });
  } catch (err) {
    console.log("Update settings error:", err);
    return c.json({ error: "Failed to update settings" }, 500);
  }
});

// ==================== SYNC ROUTE ====================

// Sync all user data (get everything at once)
app.get("/make-server-c3569cb3/sync", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const userEmail = c.get("userEmail");
    
    const [tasks, progress, settings] = await Promise.all([
      kv.get(getTasksKey(userId)),
      kv.get(getProgressKey(userId)),
      kv.get(getSettingsKey(userId)),
    ]);
    
    return c.json({
      tasks: tasks || [],
      progress: progress || getDefaultProgress(),
      settings: settings || getDefaultSettings(userEmail),
    });
  } catch (err) {
    console.log("Sync error:", err);
    return c.json({ error: "Failed to sync data" }, 500);
  }
});

Deno.serve(app.fetch);
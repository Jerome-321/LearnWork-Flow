import { useCallback } from "react";
import { useTaskAPI } from "./useTaskAPI";
import { useProgress } from "../contexts/ProgressContext";
import { Task } from "../types/task";

/**
 * Hook that coordinates task actions with automatic progress refresh.
 * When a task is created, updated, deleted, or toggled complete,
 * the progress state is automatically refreshed to stay in sync.
 */
export function useTaskWithProgressSync() {
  const { addTask: _addTask, updateTask: _updateTask, deleteTask: _deleteTask, toggleTaskComplete: _toggleTaskComplete } = useTaskAPI();
  const { refreshProgress } = useProgress();

  // ✅ Add task and refresh progress
  const addTask = useCallback(
    async (task: Omit<Task, "id" | "createdAt">) => {
      try {
        await _addTask(task);
        // Refresh progress after task is added
        await refreshProgress();
      } catch (error) {
        console.error("Error adding task:", error);
        throw error;
      }
    },
    [_addTask, refreshProgress]
  );

  // ✅ Update task and refresh progress
  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      try {
        await _updateTask(id, updates);
        // Refresh progress after task is updated
        await refreshProgress();
      } catch (error) {
        console.error("Error updating task:", error);
        throw error;
      }
    },
    [_updateTask, refreshProgress]
  );

  // ✅ Delete task and refresh progress
  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await _deleteTask(id);
        // Refresh progress after task is deleted
        await refreshProgress();
      } catch (error) {
        console.error("Error deleting task:", error);
        throw error;
      }
    },
    [_deleteTask, refreshProgress]
  );

  // ✅ Toggle task complete and refresh progress (MOST IMPORTANT)
  const toggleTaskComplete = useCallback(
    async (id: string) => {
      try {
        await _toggleTaskComplete(id);
        // Refresh progress immediately after toggle - this is critical for pet/progress updates
        await refreshProgress();
      } catch (error) {
        console.error("Error toggling task:", error);
        throw error;
      }
    },
    [_toggleTaskComplete, refreshProgress]
  );

  return {
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
  };
}

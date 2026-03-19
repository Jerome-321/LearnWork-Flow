import { useState } from "react";
import { X, Calendar, Flag, Tag, Clock, Trash2, Edit2 } from "lucide-react";
import { Task } from "../types/task";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { toast } from "sonner";

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const { updateTask, deleteTask, toggleTaskComplete } = useTaskAPI();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "bg-secondary";
      case "work":
        return "bg-secondary";
      case "personal":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  const handleSaveDescription = async () => {
    try {
      await updateTask(task.id, { description });
      setIsEditing(false);
      toast.success("Task updated successfully");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      onClose();
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task.subtasks) return;
    const updated = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    try {
      await updateTask(task.id, { subtasks: updated });
    } catch (error) {
      toast.error("Failed to update subtask");
    }
  };

  const handleToggleComplete = async () => {
    try {
      await toggleTaskComplete(task.id);
    } catch (error) {
      toast.error("Failed to toggle task");
    }
  };

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-screen w-full overflow-y-auto bg-card shadow-2xl lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-[400px] lg:border-l">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between border-b p-4 bg-secondary">
            <div className="flex-1">
              <h2 className={`text-lg font-semibold leading-tight ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}>{task.title}</h2>
              <Badge className={`mt-2 ${getCategoryColor(task.category)}`}>
                {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4 p-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={task.completed}
                onCheckedChange={handleToggleComplete}
                id={`task-detail-${task.id}`}
              />
              <label
                htmlFor={`task-detail-${task.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                {task.completed ? "Completed" : "Mark as complete"}
              </label>
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Due: {formatDueDate(task.dueDate)}</span>
                <span className="text-muted-foreground">
                  {new Date(task.dueDate).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span>Priority:</span>
                <Badge variant={getPriorityColor(task.priority)}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Points: {task.points}</span>
              </div>

              {task.tags && task.tags.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Description</h3>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDescription(task.description);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {task.description || "No description"}
                </p>
              )}
            </div>

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">Subtasks</h3>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask.id)}
                        id={`subtask-${subtask.id}`}
                      />
                      <label
                        htmlFor={`subtask-${subtask.id}`}
                        className={`flex-1 text-sm cursor-pointer ${
                          subtask.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {subtask.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t p-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
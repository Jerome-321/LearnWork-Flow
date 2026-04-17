import { Task } from "../types/task";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  GraduationCap,
  Briefcase,
  User,
  Calendar,
  Flag,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { useState } from "react";

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}

export function TaskList({ tasks, selectedTaskId, onSelectTask }: TaskListProps) {
  const { toggleTaskComplete, actionLoading } = useTaskAPI();
  const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(new Set());

  const handleToggle = async (taskId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('handleToggle called for task:', taskId);
    
    setLoadingTaskIds(prev => new Set(prev).add(taskId));
    
    try {
      await toggleTaskComplete(taskId);
    } catch (error) {
      console.error("Failed to toggle task:", error);
    } finally {
      setTimeout(() => {
        setLoadingTaskIds(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 500);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic":
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case "work":
        return <Briefcase className="h-4 w-4 text-purple-600" />;
      case "personal":
        return <User className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-gray-400";
      default:
        return "";
    }
  };

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d < today && d.toDateString() !== today.toDateString()) {
      return { text: "Overdue", className: "text-red-600 font-medium" };
    }
    if (d.toDateString() === today.toDateString()) {
      return { text: "Today", className: "text-orange-600 font-medium" };
    }
    if (d.toDateString() === tomorrow.toDateString()) {
      return { text: "Tomorrow", className: "text-blue-600" };
    }

    return {
      text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      className: "text-muted-foreground",
    };
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
        <p className="text-sm text-muted-foreground">
          You're all caught up! Add a new task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {tasks.map((task) => {
        const dueDate = formatDueDate(task.dueDate);
        const isSelected = task.id === selectedTaskId;
        const isLoading = loadingTaskIds.has(task.id) || actionLoading;

        return (
          <div
            key={task.id}
            className={cn(
              "flex items-start gap-3 border-l-4 p-4 transition-colors hover:bg-accent cursor-pointer relative",
              getPriorityColor(task.priority),
              isSelected && "bg-accent",
              task.completed && "opacity-60",
              actionLoading && "pointer-events-none opacity-50"
            )}
            onClick={() => onSelectTask(task.id)}
          >
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-10 rounded">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">Updating...</span>
                </div>
              </div>
            )}

            {/* Simple Checkbox Icon */}
            <button
              type="button"
              onClick={(e) => handleToggle(task.id, e)}
              onTouchEnd={(e) => handleToggle(task.id, e)}
              className="mt-1 touch-manipulation flex-shrink-0 focus:outline-none active:scale-95 transition-transform"
              aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Category Icon */}
            <div className="mt-1">{getCategoryIcon(task.category)}</div>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <h3
                    className={cn(
                      "font-medium mb-1",
                      task.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {task.description || "No description"}
                  </p>

                  {/* Image Preview */}
                  {task.image && (
                    <div className="mb-2">
                      <img
                        src={task.image}
                        alt={task.title}
                        className="w-full max-h-20 object-cover rounded border"
                      />
                    </div>
                  )}

                  {/* Link Display */}
                  {task.link && (
                    <div className="mb-2">
                      <a
                        href={task.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center gap-1"
                      >
                        🔗 {task.link}
                      </a>
                    </div>
                  )}
                </div>

                {/* Done/Undo Button */}
                <Button
                  size="sm"
                  variant={task.completed ? "secondary" : "default"}
                  className="touch-manipulation flex-shrink-0"
                  onClick={(e) => handleToggle(task.id, e)}
                  onTouchEnd={(e) => handleToggle(task.id, e)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Loading
                    </>
                  ) : task.completed ? (
                    "Undo"
                  ) : (
                    "Done"
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className={dueDate.className}>{dueDate.text}</span>
                </div>

                {task.priority === "high" && (
                  <Badge variant="destructive" className="h-5 text-xs">
                    <Flag className="mr-1 h-3 w-3" />
                    High Priority
                  </Badge>
                )}

                {task.points > 0 && (
                  <Badge variant="secondary" className="h-5 text-xs">
                    {task.points} pts
                  </Badge>
                )}

                {task.tags && task.tags.length > 0 && (
                  <div className="flex gap-1">
                    {task.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="h-5 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
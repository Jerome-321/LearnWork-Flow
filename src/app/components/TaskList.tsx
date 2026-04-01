import { Task } from "../types/task";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button"; // ✅ added
import {
  GraduationCap,
  Briefcase,
  User,
  Calendar,
  Flag,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useTaskAPI } from "../hooks/useTaskAPI";

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}

export function TaskList({ tasks, selectedTaskId, onSelectTask }: TaskListProps) {
  const { toggleTaskComplete } = useTaskAPI();

  // ✅ FIXED: no event needed
  const handleToggle = async (taskId: string) => {
    try {
      await toggleTaskComplete(taskId);
    } catch (error) {
      console.error("Failed to toggle task:", error);
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

        return (
          <div
            key={task.id}
            className={cn(
              "flex items-start gap-3 border-l-4 p-4 transition-colors hover:bg-accent cursor-pointer",
              getPriorityColor(task.priority),
              isSelected && "bg-accent",
              task.completed && "opacity-60"
            )}
            onClick={() => onSelectTask(task.id)}
          >
            {/* Checkbox */}
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => handleToggle(task.id)} // ✅ fixed
              onClick={(e) => e.stopPropagation()}
              id={`task-${task.id}`}
              className="mt-1"
            />

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

                {/* ✅ NEW BUTTON */}
                <Button
                  size="sm"
                  variant={task.completed ? "secondary" : "default"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(task.id);
                  }}
                >
                  {task.completed ? "Undo" : "Done"}
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
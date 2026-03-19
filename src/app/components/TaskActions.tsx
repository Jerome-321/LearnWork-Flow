import { useState, useRef } from "react";
import { Plus, Sparkles, X, Calendar, Flag, Tag, Clock, Trash2, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { Task, TaskCategory, TaskPriority } from "../types/task";
import { toast } from "sonner";
import { AITaskAssistant } from "./AITaskAssistant";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface TaskActionsProps {
  task?: Task;
  onClose?: () => void;
}

export function TaskActions({ task, onClose }: TaskActionsProps = {}) {
  const { addTask, updateTask, deleteTask, toggleTaskComplete } = useTaskAPI();
  const [open, setOpen] = useState(false);
  const [showAI, setShowAI] = useState(true); // AI shown by default
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState(task?.description || "");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "personal" as TaskCategory,
    priority: "medium" as TaskPriority,
    dueDate: "",
    dueTime: "",
    image: null as File | null,
    link: "",
  });

  // Update description when task changes
  useState(() => {
    if (task) {
      setDescription(task.description || "");
    }
  }, [task]);

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
    if (!task) return;
    try {
      await updateTask(task.id, { description });
      setIsEditing(false);
      toast.success("Task updated successfully");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTask(task.id);
      onClose?.();
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task?.subtasks) return;
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
    if (!task) return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (!formData.dueDate) {
      toast.error("Please select a due date");
      return;
    }

    const dueDateTime = formData.dueTime
      ? `${formData.dueDate}T${formData.dueTime}:00`
      : `${formData.dueDate}T23:59:00`;

    const points =
      formData.priority === "high" ? 50 : formData.priority === "medium" ? 30 : 15;

    try {
      await addTask({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        dueDate: dueDateTime,
        completed: false,
        points,
        image: formData.image,
        link: formData.link || undefined,
      });

      toast.success("Task created successfully");
      setOpen(false);
      setShowAI(true);
      setImagePreview(null);
      setFormData({
        title: "",
        description: "",
        category: "personal",
        priority: "medium",
        dueDate: "",
        dueTime: "",
        image: null,
        link: "",
      });
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error?.message || "Failed to create task");
    }
  };

  const handleTitleChange = (value: string) => {
    setFormData({ ...formData, title: value });
  };

  const handleApplyAISuggestion = (suggestion: any) => {
    // ✅ IMPROVED: Parse suggested_time from AI (format: "HH:MM")
    let dueDate = formData.dueDate || "";
    let dueTime = "18:00"; // Default fallback

    // If we have a suggested time from AI
    if (suggestion.suggested_time) {
      dueTime = suggestion.suggested_time; // Already in HH:MM format
    }

    // If we have a suggested deadline (for future use)
    if (suggestion.suggestedDeadline) {
      const deadlineText = suggestion.suggestedDeadline;

      if (deadlineText.includes("Today")) {
        if (!dueDate) dueDate = new Date().toISOString().split("T")[0];
      } else if (deadlineText.includes("Tomorrow")) {
        if (!dueDate) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          dueDate = tomorrow.toISOString().split("T")[0];
        }
      } else if (!dueDate) {
        // Default to 3 days from now if no date set
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        dueDate = futureDate.toISOString().split("T")[0];
      }
    }

    // Apply the suggestion to form
    setFormData({
      ...formData,
      priority: suggestion.priority || formData.priority,
      dueDate: dueDate || formData.dueDate,
      dueTime: dueTime,
    });

    toast.success("✨ AI schedule applied!");
  };

  // Image handling functions
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setFormData({ ...formData, image: file });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleAI = () => {
    if (!open) {
      setOpen(true);
      setShowAI(true);
    } else {
      setShowAI(!showAI);
    }
  };

  // If task is provided, render task detail view
  if (task) {
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
                          setDescription(task.description || "");
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    {task.description || "No description"}
                  </div>
                )}
              </div>

              {/* Image Display */}
              {task.image && (
                <div>
                  <h3 className="mb-2 font-semibold">Image</h3>
                  <img
                    src={task.image}
                    alt={task.title}
                    className="w-full max-h-48 object-cover rounded-lg border"
                  />
                </div>
              )}

              {/* Link Display */}
              {task.link && (
                <div>
                  <h3 className="mb-2 font-semibold">Link</h3>
                  <a
                    href={task.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center gap-2"
                  >
                    🔗 {task.link}
                  </a>
                </div>
              )}

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

  // Default: render create task form
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showAI && open ? "default" : "outline"}
              size="icon"
              onClick={toggleAI}
              className="h-10 w-10"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl p-0 gap-0 overflow-hidden">
          <div className="flex flex-col lg:flex-row max-h-[90vh]">
            {/* AI Assistant Panel - LEFT SIDE */}
            {showAI && (
              <div className="lg:border-r lg:max-h-[90vh] lg:overflow-y-auto">
                <AITaskAssistant
                  title={formData.title}
                  description={formData.description}
                  category={formData.category}
                  priority={formData.priority}
                  dueDate={formData.dueDate}
                  onApplySuggestion={handleApplyAISuggestion}
                  show={showAI && open}
                  onHide={() => setShowAI(false)}
                />
              </div>
            )}

            {/* Task Form - RIGHT SIDE */}
            <div className="flex-1 p-6 overflow-y-auto">
              <DialogHeader className="mb-4">
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your to-do list with a title, description, category,
                  priority, and due date.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter task title"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Add details about this task"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="image">Image Upload</Label>
                  <Input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="link">Link</Label>
                  <Input
                    id="link"
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: TaskCategory) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: TaskPriority) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="dueTime">Due Time</Label>
                    <Input
                      id="dueTime"
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) =>
                        setFormData({ ...formData, dueTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Create Task
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setShowAI(true);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
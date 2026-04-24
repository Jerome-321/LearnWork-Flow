import { useState, useRef, useEffect } from "react";
import { Plus, Sparkles, X, Calendar, Flag, Tag, Clock, Trash2, Save } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useAuth } from "../contexts/AuthContext";
import { ActionLoadingOverlay } from "./ActionLoadingOverlay";

interface TaskActionsProps {
  task?: Task;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TaskActions({ task, onClose, open: externalOpen, onOpenChange }: TaskActionsProps = {}) {
  const { addTask, updateTask, deleteTask, toggleTaskComplete, tasks, actionLoading } = useTaskAPI();
  const { getAccessToken } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzingSubmit, setIsAnalyzingSubmit] = useState(false);
  const [pendingTaskPayload, setPendingTaskPayload] = useState<any>(null);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);
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

  const cleanReason = (text: string) => {
    return text
      .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
      .replace(/[\u2600-\u27BF]/g, "")
      .trim();
  };

  const formatTime12Hour = (timeString: string) => {
    if (!timeString) return "";
    const [hourStr, minStr] = timeString.split(":");
    if (!hourStr || !minStr) return timeString;
    let hour = parseInt(hourStr, 10);
    const minute = minStr;
    const period = hour >= 12 ? "PM" : "AM";
    if (hour === 0) hour = 12;
    if (hour > 12) hour -= 12;
    return `${hour}:${minute} ${period}`;
  };

  useEffect(() => {
    if (task) {
      const dueDate = new Date(task.dueDate);
      const dueTime = dueDate.toTimeString().slice(0, 5);
      setFormData({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        dueDate: dueDate.toISOString().split('T')[0],
        dueTime: dueTime,
        image: null,
        link: task.link || "",
      });
      setDescription(task.description || "");
    }
  }, [task]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getCategoryColor = (category: string) => {
    return "bg-secondary";
  };

  const handleSaveAllChanges = async () => {
    if (!task) return;
    
    // Check if date/time/priority changed - trigger AI analysis
    const dueDateTime = formData.dueTime
      ? `${formData.dueDate}T${formData.dueTime}:00`
      : `${formData.dueDate}T23:59:00`;
    
    const originalDueDate = new Date(task.dueDate).toISOString();
    const hasScheduleChange = dueDateTime !== originalDueDate || 
                              formData.priority !== task.priority ||
                              formData.category !== task.category;
    
    if (hasScheduleChange) {
      // Trigger AI analysis for schedule changes
      try {
        setIsAnalyzingSubmit(true);
        const token = getAccessToken();
        const response = await fetch("https://learnwork-flow.onrender.com/api/ai/analyze/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            id: task.id,  // Include task ID to exclude from conflict check
            title: formData.title,
            description: description,
            category: formData.category,
            priority: formData.priority,
            dueDate: dueDateTime,
            estimatedDuration: 60,
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          
          // Show AI modal for any AI response (conflict, awareness, or suggestion)
          setAiSuggestion({
            ...aiData,
            suggested_time: aiData.suggested_time || formData.dueTime || "18:00",
            priority: aiData.priority || formData.priority,
            reason: aiData.reason || "Schedule conflict detected.",
          });
          
          // Store pending update
          setPendingTaskPayload({
            title: formData.title,
            description: description,
            category: formData.category,
            priority: formData.priority,
            dueDate: dueDateTime,
          });
          
          setIsAnalyzingSubmit(false);
          setShowAiModal(true);
          return; // Don't save yet, wait for user decision
        }
      } catch (err) {
        console.error("Error during AI analysis:", err);
        // Continue with update even if AI fails
      } finally {
        setIsAnalyzingSubmit(false);
      }
    }
    
    // No conflicts or AI analysis failed - proceed with update
    try {
      await updateTask(task.id, {
        title: formData.title,
        description: description,
        category: formData.category,
        priority: formData.priority,
        dueDate: dueDateTime,
      });
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

  const buildTaskPayload = () => {
    const dueDateTime = formData.dueTime
      ? `${formData.dueDate}T${formData.dueTime}:00`
      : `${formData.dueDate}T23:59:00`;
    const points = formData.priority === "high" ? 50 : formData.priority === "medium" ? 30 : 15;
    return {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      dueDate: dueDateTime,
      points,
      image: formData.image,
      link: formData.link || undefined,
      completed: false,
    };
  };

  const resetForm = () => {
    setOpen(false);
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
    setAiSuggestion(null);
    setShowAiModal(false);
  };

  const saveTask = async (payload: any) => {
    try {
      const createdTask = await addTask(payload, false);
      if (createdTask?.conflict) {
        toast.error(`Schedule conflict detected: ${createdTask.message}`);
      } else {
        toast.success("Task created successfully");
      }
      resetForm();
      setTimeout(() => window.location.reload(), 150);
    } catch (error: any) {
      console.error("Error saving task:", error);
      toast.error(error?.message || "Failed to save task");
    }
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
    const taskPayload = buildTaskPayload();
    
    try {
      setIsAnalyzingSubmit(true);
      setPendingTaskPayload(taskPayload);
      const token = getAccessToken();
      const response = await fetch("https://learnwork-flow.onrender.com/api/ai/analyze/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          dueDate: taskPayload.dueDate,
          estimatedDuration: 60,
          existingTasks: tasks || [],
        }),
      });

      let aiData: any = null;
      if (response.ok) {
        aiData = await response.json();
      }

      if (!aiData) {
        setAiSuggestion({
          suggested_time: formData.dueTime || "18:00",
          priority: formData.priority,
          reason: response.ok
            ? "No recommendation available, review your schedule."
            : "Service unavailable; please confirm your task setup.",
          estimated_duration: "1–2 hours",
        });
      } else {
        setAiSuggestion({
          ...aiData,
          suggested_time: aiData.suggested_time || formData.dueTime || "18:00",
          priority: aiData.priority || formData.priority,
          reason: aiData.reason || "Analysis completed.",
        });
      }

      await new Promise((r) => setTimeout(r, 600));
      setShowAiModal(true);
    } catch (err) {
      console.error("Error during AI flow:", err);
      toast.info("Creating task without schedule analysis...");
      try {
        await saveTask(taskPayload);
      } catch (saveErr) {
        toast.error("Failed to create task");
      }
    } finally {
      setIsAnalyzingSubmit(false);
    }
  };

  const handleAIModalDecline = async () => {
    if (!pendingTaskPayload) {
      toast.error("No task data available");
      return;
    }
    
    // Q1/Q3: Even if user declines suggestion, still mark as fixed if AI detected it
    const finalPayload = {
      ...pendingTaskPayload,
      is_fixed: aiSuggestion?.should_mark_fixed || false,
    };
    
    // Check if we're updating or creating
    if (task) {
      // Updating existing task - use original values
      try {
        await updateTask(task.id, finalPayload);
        toast.success("Task updated with your original settings");
        setShowAiModal(false);
        setAiSuggestion(null);
        setPendingTaskPayload(null);
        setIsEditing(false);
      } catch (error) {
        toast.error("Failed to update task");
      }
    } else {
      // Creating new task
      try {
        await addTask(finalPayload, true);
        toast.success("Task created with your original settings");
        setShowAiModal(false);
        setAiSuggestion(null);
        setPendingTaskPayload(null);
        resetForm();
      } catch (error) {
        toast.error("Failed to create task");
      }
    }
  };

  const handleAIModalAccept = async () => {
    if (!aiSuggestion || !pendingTaskPayload) {
      toast.error("No suggestion available");
      return;
    }
    const suggestedTime = aiSuggestion.suggested_time || formData.dueTime;
    const suggestedPriority = aiSuggestion.priority || formData.priority;
    const finalPayload = {
      ...pendingTaskPayload,
      dueDate: `${formData.dueDate}T${suggestedTime}:00`,
      priority: suggestedPriority,
      // Q1/Q3: Auto-mark as fixed if AI detected it (exam, meeting, birthday, etc.)
      is_fixed: aiSuggestion.should_mark_fixed || false,
    };
    
    // Check if we're updating or creating
    if (task) {
      // Updating existing task
      try {
        await updateTask(task.id, finalPayload);
        toast.success("Task updated with suggestion applied");
        setIsEditing(false);
      } catch (err) {
        toast.error("Failed to update task");
      } finally {
        setPendingTaskPayload(null);
        setAiSuggestion(null);
        setShowAiModal(false);
      }
    } else {
      // Creating new task
      try {
        await addTask(finalPayload, true);
        toast.success("Task created with suggestion applied");
      } catch (err) {
        toast.error("Failed to create task");
      } finally {
        setPendingTaskPayload(null);
        setAiSuggestion(null);
        setShowAiModal(false);
        resetForm();
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setFormData({ ...formData, image: file });
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

  if (task) {
    return (
      <>
        <ActionLoadingOverlay isLoading={actionLoading} message="Processing..." />
        
        {isAnalyzingSubmit && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30 px-4">
            <div className="flex items-center gap-2 rounded-lg bg-white p-4 text-sm font-medium shadow-lg">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
              Analyzing schedule...
            </div>
          </div>
        )}

        <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold">Scheduling Suggestion</DialogTitle>
            </DialogHeader>
            {aiSuggestion && (
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <div className="text-sm font-semibold text-gray-600 mb-1">Suggested Time:</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDueDate(formData.dueDate)} at {formatTime12Hour(aiSuggestion.suggested_time || "18:00")}
                  </div>
                </div>
                {aiSuggestion.reason && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Details</div>
                    <div className="text-sm text-gray-700">{cleanReason(aiSuggestion.reason)}</div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={handleAIModalAccept}>✓ Accept</Button>
              <Button className="flex-1" variant="outline" onClick={handleAIModalDecline}>✕ Keep Original</Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto bg-card shadow-2xl rounded-t-2xl lg:right-0 lg:left-auto lg:top-16 lg:bottom-0 lg:rounded-none lg:h-[calc(100vh-4rem)] lg:w-[500px] lg:border-l">
          <div className="flex flex-col h-full">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b p-4 bg-secondary">
              <h2 className="text-lg font-semibold">Task Details</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 space-y-6 p-4 pb-32 overflow-y-auto">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={handleToggleComplete}
                  id={`task-detail-${task.id}`}
                />
                <label htmlFor={`task-detail-${task.id}`} className="text-sm font-medium cursor-pointer">
                  {task.completed ? "Completed" : "Mark as complete"}
                </label>
              </div>

              <div>
                <Label>Title</Label>
                {isEditing ? (
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <h3 className={`text-xl font-semibold mt-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </h3>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  {isEditing ? (
                    <Select value={formData.category} onValueChange={(value: TaskCategory) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`mt-1 ${getCategoryColor(task.category)}`}>
                      {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label>Priority</Label>
                  {isEditing ? (
                    <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getPriorityColor(task.priority)} className="mt-1">
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date</Label>
                  {isEditing ? (
                    <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="mt-1" />
                  ) : (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDueDate(task.dueDate)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Due Time</Label>
                  {isEditing ? (
                    <Input type="time" value={formData.dueTime} onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })} className="mt-1" />
                  ) : (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(task.dueDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                    </div>
                  )}
                </div>
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
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="resize-none mt-1" />
                ) : (
                  <div className="text-sm text-muted-foreground mt-1">{task.description || "No description"}</div>
                )}
              </div>

              {task.image && (
                <div>
                  <Label>Image</Label>
                  <img src={task.image} alt={task.title} className="w-full max-h-48 object-cover rounded-lg border mt-1" />
                </div>
              )}

              {task.link && (
                <div>
                  <Label>Link</Label>
                  <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all flex items-center gap-2 mt-1">
                    🔗 {task.link}
                  </a>
                </div>
              )}

              {task.subtasks && task.subtasks.length > 0 && (
                <div>
                  <Label>Subtasks</Label>
                  <div className="space-y-2 mt-1">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <Checkbox checked={subtask.completed} onCheckedChange={() => handleToggleSubtask(subtask.id)} id={`subtask-${subtask.id}`} />
                        <label htmlFor={`subtask-${subtask.id}`} className={`flex-1 text-sm cursor-pointer ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                          {subtask.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t p-4 bg-card space-y-2">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleSaveAllChanges}>
                    <Save className="mr-2 h-4 w-4" />Save Changes
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setIsEditing(false);
                    const dueDate = new Date(task.dueDate);
                    const dueTime = dueDate.toTimeString().slice(0, 5);
                    setFormData({
                      title: task.title,
                      description: task.description,
                      category: task.category,
                      priority: task.priority,
                      dueDate: dueDate.toISOString().split('T')[0],
                      dueTime: dueTime,
                      image: null,
                      link: task.link || "",
                    });
                    setDescription(task.description || "");
                  }}>Cancel</Button>
                </div>
              ) : (
                <>
                  <Button variant="default" className="w-full" onClick={() => setIsEditing(true)}>Edit Task</Button>
                  <Button variant="destructive" className="w-full" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />Delete Task
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ActionLoadingOverlay isLoading={actionLoading} message="Creating task..." />
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Sparkles className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p> Assistant</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isAnalyzingSubmit && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30 px-4">
          <div className="flex items-center gap-2 rounded-lg bg-white p-4 text-sm font-medium shadow-lg">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
            Analyzing...
          </div>
        </div>
      )}

      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">
              {aiSuggestion?.type === 'fixed_vs_work_conflict' ? '⚠️ Fixed Event Conflict' :
               aiSuggestion?.type === 'fixed_vs_fixed_conflict' ? '🚨 Critical Conflict' :
               'Scheduling Suggestion'}
            </DialogTitle>
          </DialogHeader>
          {aiSuggestion && (
            <div className="space-y-4">
              {/* Q4: Urgency Upgrade Banner */}
              {aiSuggestion.urgency_upgrade && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 font-semibold">⚡ Priority Upgraded</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {aiSuggestion.original_priority} → {aiSuggestion.new_priority} (Deadline approaching)
                  </p>
                </div>
              )}

              {/* Q1: Professional Significance Banner */}
              {aiSuggestion.professional_significance === 'high' && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-semibold">💼 Professionally Significant</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    This event has high professional importance
                  </p>
                </div>
              )}

              {/* Q3: Context Detection */}
              {aiSuggestion.context_detected && (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                  <p className="text-sm text-purple-700">{aiSuggestion.context_detected}</p>
                </div>
              )}

              {/* Main Suggestion */}
              <div className="border-b pb-3">
                <div className="text-sm font-semibold text-gray-600 mb-1">Suggested Time:</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDueDate(formData.dueDate)} at {formatTime12Hour(aiSuggestion.suggested_time || "18:00")}
                  {aiSuggestion.type === 'fixed_vs_work_conflict' && (
                    <span className="text-sm font-normal text-gray-600 ml-2">(UNCHANGED)</span>
                  )}
                </div>
              </div>

              {/* Q2: Deadline Impact Warning */}
              {aiSuggestion.deadline_impact && (
                <div className={`border-l-4 p-3 rounded ${
                  aiSuggestion.deadline_impact.severity === 'critical' ? 'bg-red-50 border-red-500' :
                  aiSuggestion.deadline_impact.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                  'bg-yellow-50 border-yellow-500'
                }`}>
                  <div className="font-semibold text-sm mb-1">
                    ⏰ Deadline Impact: {aiSuggestion.deadline_impact.hours_until_deadline.toFixed(1)} hours remaining
                  </div>
                  <p className="text-sm text-gray-700">
                    Free hours if you proceed: {aiSuggestion.deadline_impact.free_hours_if_proceed.toFixed(1)} hours
                  </p>
                </div>
              )}

              {/* Reason/Details */}
              {aiSuggestion.reason && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Details</div>
                  <div className="text-sm text-gray-700 whitespace-pre-line">{cleanReason(aiSuggestion.reason)}</div>
                </div>
              )}

              {/* Q1: Leave Request Draft */}
              {aiSuggestion.leave_request_draft && (
                <div className="bg-gray-50 border rounded p-3">
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-2">📧 Leave Request Draft</div>
                  <div className="text-xs text-gray-700 whitespace-pre-line font-mono bg-white p-2 rounded border max-h-40 overflow-y-auto">
                    {aiSuggestion.leave_request_draft}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(aiSuggestion.leave_request_draft);
                      toast.success('Leave request copied to clipboard');
                    }}
                  >
                    📋 Copy to Clipboard
                  </Button>
                </div>
              )}

              {/* Q8: Multiple Resolution Options */}
              {aiSuggestion.resolution_options && aiSuggestion.resolution_options.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Resolution Options</div>
                  {aiSuggestion.resolution_options.map((option: any, idx: number) => (
                    <div key={idx} className="border rounded p-3 hover:bg-gray-50 cursor-pointer transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-sm">Option {option.option}: {option.action}</div>
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {option.feasibility_score}% feasible
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>✅ Preserves: {option.preserves}</div>
                        <div>❌ Sacrifices: {option.sacrifices}</div>
                        {option.emotional_impact && (
                          <div>💭 Emotional: {option.emotional_impact}</div>
                        )}
                        {option.income_impact && (
                          <div>💰 Income: {option.income_impact}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-700 mt-2 italic">{option.trade_off}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Q3: Clarification Question */}
              {aiSuggestion.needs_clarification && aiSuggestion.clarification_question && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                  <div className="font-semibold text-sm mb-1">❓ Need More Information</div>
                  <p className="text-sm text-gray-700">{aiSuggestion.clarification_question}</p>
                </div>
              )}

              {/* Q5: Productivity Score */}
              {aiSuggestion.productivity_score && (
                <div className="bg-green-50 border rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">📊 Productivity Score</span>
                    <span className="text-lg font-bold text-green-600">
                      {Math.round(aiSuggestion.productivity_score * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <Button className="flex-1" onClick={handleAIModalAccept}>✓ Accept</Button>
            <Button className="flex-1" variant="outline" onClick={handleAIModalDecline}>✕ Keep Original</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] lg:max-w-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task with title, description, category, priority, and due date.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter task title" autoFocus />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add details" rows={3} />
            </div>
            <div>
              <Label htmlFor="image">Image Upload</Label>
              <Input ref={fileInputRef} id="image" type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="mt-2 relative">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border" />
                  <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeImage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="link">Link</Label>
              <Input id="link" type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="https://example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value: TaskCategory) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
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
                <Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="dueTime">Due Time</Label>
                <Input id="dueTime" type="time" value={formData.dueTime} onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={isAnalyzingSubmit}>
                {isAnalyzingSubmit ? "Creating..." : "Create Task"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isAnalyzingSubmit}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

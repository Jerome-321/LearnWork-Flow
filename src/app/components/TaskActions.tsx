import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
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
import { useTaskAPI } from "../hooks/useTaskAPI";
import { TaskCategory, TaskPriority } from "../types/task";
import { toast } from "sonner";
import { AITaskAssistant } from "./AITaskAssistant";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function TaskActions() {
  const { addTask } = useTaskAPI();
  const [open, setOpen] = useState(false);
  const [showAI, setShowAI] = useState(true); // AI shown by default
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "personal" as TaskCategory,
    priority: "medium" as TaskPriority,
    dueDate: "",
    dueTime: "",
  });

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
      });

      toast.success("Task created successfully");
      setOpen(false);
      setShowAI(true);
      setFormData({
        title: "",
        description: "",
        category: "personal",
        priority: "medium",
        dueDate: "",
        dueTime: "",
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

  const toggleAI = () => {
    if (!open) {
      setOpen(true);
      setShowAI(true);
    } else {
      setShowAI(!showAI);
    }
  };

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
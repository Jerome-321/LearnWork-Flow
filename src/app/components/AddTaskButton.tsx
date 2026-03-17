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
import { AITaskAssistantFloating } from "./AITaskAssistantFloating";

export function AddTaskButton() {
  const { addTask } = useTaskAPI();
  const [open, setOpen] = useState(false);
  const [showAI, setShowAI] = useState(false);
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
      setShowAI(false);
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
    setShowAI(value.trim().length > 3); // Show AI after 3 characters
  };

  const handleApplyAISuggestion = (suggestion: any) => {
    // Parse the deadline suggestion to date/time
    const deadlineText = suggestion.suggestedDeadline;
    let dueDate = "";
    let dueTime = "18:00"; // Default to 6 PM

    if (deadlineText?.includes("Today")) {
      dueDate = new Date().toISOString().split("T")[0];
    } else if (deadlineText?.includes("Tomorrow")) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = tomorrow.toISOString().split("T")[0];
    } else if (deadlineText) {
      // Parse other date formats
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3); // Default 3 days
      dueDate = futureDate.toISOString().split("T")[0];
    }

    setFormData({
      ...formData,
      priority: suggestion.priority || formData.priority,
      dueDate: dueDate || formData.dueDate,
      dueTime: dueTime,
    });

    toast.success("AI suggestions applied!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
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
                  setShowAI(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Floating AI Assistant on LEFT side - Outside Dialog */}
      <AITaskAssistantFloating
        title={formData.title}
        description={formData.description}
        category={formData.category}
        onApplySuggestion={handleApplyAISuggestion}
        show={showAI && open}
        onHide={() => setShowAI(false)}
      />
    </>
  );
}
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Clock,
  Calendar,
  Flag,
  Sun,
  Moon,
  Coffee,
  ListChecks,
  CheckCircle2,
  X,
  ChevronRight,
  EyeOff,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { TaskCategory, TaskPriority } from "../types/task";

interface AISuggestion {
  estimatedTime: string;
  suggestedDeadline: string;
  priority: TaskPriority;
  timeOfDay: "morning" | "afternoon" | "evening";
  subtasks: string[];
  breakReminder?: string;
  reasoning: string;
  productivityTip?: string;
}

interface AITaskAssistantFloatingProps {
  title: string;
  description: string;
  category: TaskCategory;
  onApplySuggestion: (suggestion: Partial<AISuggestion>) => void;
  show: boolean;
  onHide: () => void;
}

export function AITaskAssistantFloating({
  title,
  description,
  category,
  onApplySuggestion,
  show,
  onHide,
}: AITaskAssistantFloatingProps) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!show || !title.trim()) {
      setSuggestion(null);
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set analyzing state immediately for responsiveness
    setIsAnalyzing(true);

    // Debounce the analysis to avoid running on every keystroke
    debounceTimerRef.current = setTimeout(() => {
      analyzeTask();
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, description, category, show]);

  const analyzeTask = () => {
    const analyzed = generateSmartSuggestions(title, description, category);
    setSuggestion(analyzed);
    setIsAnalyzing(false);
  };

  const generateSmartSuggestions = (
    title: string,
    description: string,
    category: TaskCategory
  ): AISuggestion => {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    const combinedText = `${titleLower} ${descLower}`;

    // Analyze task complexity
    const isComplex =
      combinedText.includes("project") ||
      combinedText.includes("research") ||
      combinedText.includes("develop") ||
      combinedText.includes("design") ||
      combinedText.includes("complete") ||
      combinedText.includes("prepare") ||
      combinedText.includes("write") ||
      combinedText.includes("create") ||
      combinedText.includes("build");

    const isQuick =
      combinedText.includes("call") ||
      combinedText.includes("email") ||
      combinedText.includes("reply") ||
      combinedText.includes("send") ||
      combinedText.includes("check") ||
      combinedText.includes("review") ||
      combinedText.includes("quick") ||
      combinedText.includes("brief");

    const isUrgent =
      combinedText.includes("urgent") ||
      combinedText.includes("asap") ||
      combinedText.includes("important") ||
      combinedText.includes("deadline") ||
      combinedText.includes("today") ||
      combinedText.includes("immediately") ||
      combinedText.includes("critical");

    const isLongTerm =
      combinedText.includes("long-term") ||
      combinedText.includes("semester") ||
      combinedText.includes("quarter") ||
      combinedText.includes("month");

    // Estimated time
    let estimatedTime = "1–2 hours";
    if (isQuick) estimatedTime = "15–30 minutes";
    else if (isComplex) estimatedTime = "3–5 hours";
    else if (isLongTerm) estimatedTime = "Multiple days";

    // Priority
    let priority: TaskPriority = "medium";
    if (isUrgent || category === "work") priority = "high";
    else if (isQuick && !isUrgent) priority = "low";
    else if (isComplex) priority = "high";

    // Suggested deadline
    const now = new Date();
    let deadlineDate = new Date(now);

    if (isUrgent) {
      deadlineDate.setDate(now.getDate() + 1); // Tomorrow
    } else if (isComplex || isLongTerm) {
      deadlineDate.setDate(now.getDate() + 7); // 1 week
    } else if (isQuick) {
      deadlineDate.setDate(now.getDate() + 1); // Tomorrow
    } else {
      deadlineDate.setDate(now.getDate() + 3); // 3 days
    }

    const suggestedDeadline = formatDeadline(deadlineDate);

    // Time of day
    let timeOfDay: "morning" | "afternoon" | "evening" = "morning";
    if (category === "academic") timeOfDay = "morning";
    else if (category === "work") timeOfDay = "afternoon";
    else timeOfDay = "evening";

    // Override for specific keywords
    if (combinedText.includes("morning")) timeOfDay = "morning";
    if (combinedText.includes("afternoon")) timeOfDay = "afternoon";
    if (combinedText.includes("evening") || combinedText.includes("night"))
      timeOfDay = "evening";

    // Subtasks
    const subtasks = generateSubtasks(titleLower, descLower, category, isComplex);

    // Break reminder
    let breakReminder: string | undefined;
    if (isComplex) {
      breakReminder = "Take a 10-minute break every hour for optimal focus";
    }

    // Productivity tip
    let productivityTip = "";
    if (isComplex) {
      productivityTip =
        "Break this down into smaller chunks and tackle them one at a time.";
    } else if (isQuick) {
      productivityTip = "Quick wins boost motivation! Do this first.";
    } else if (isUrgent) {
      productivityTip =
        "Set a timer and eliminate distractions for this urgent task.";
    } else {
      productivityTip =
        "Schedule this during your most productive hours for best results.";
    }

    // Reasoning
    let reasoning = `Based on "${title}", this appears to be a `;
    if (isComplex) reasoning += "complex task requiring focused work time.";
    else if (isQuick) reasoning += "quick task that can be completed rapidly.";
    else if (isUrgent) reasoning += "high-priority task needing immediate attention.";
    else reasoning += "moderate task with standard time requirements.";

    return {
      estimatedTime,
      suggestedDeadline,
      priority,
      timeOfDay,
      subtasks,
      breakReminder,
      reasoning,
      productivityTip,
    };
  };

  const generateSubtasks = (
    title: string,
    description: string,
    category: TaskCategory,
    isComplex: boolean
  ): string[] => {
    const subtasks: string[] = [];

    // Research-related tasks
    if (title.includes("research") || description.includes("research")) {
      subtasks.push("Gather sources and references");
      subtasks.push("Read and take notes");
      subtasks.push("Organize findings");
      subtasks.push("Write summary");
    }
    // Writing tasks
    else if (
      title.includes("write") ||
      title.includes("essay") ||
      title.includes("paper") ||
      title.includes("report")
    ) {
      subtasks.push("Create outline");
      subtasks.push("Write first draft");
      subtasks.push("Review and edit");
      subtasks.push("Proofread and finalize");
    }
    // Study tasks
    else if (
      title.includes("study") ||
      title.includes("exam") ||
      title.includes("test")
    ) {
      subtasks.push("Review materials");
      subtasks.push("Create study notes");
      subtasks.push("Practice problems");
      subtasks.push("Self-assessment");
    }
    // Project tasks
    else if (title.includes("project") || description.includes("project")) {
      subtasks.push("Define project scope");
      subtasks.push("Create timeline");
      subtasks.push("Execute main tasks");
      subtasks.push("Review and refine");
    }
    // Meeting/presentation tasks
    else if (
      title.includes("meeting") ||
      title.includes("presentation") ||
      title.includes("prepare")
    ) {
      subtasks.push("Prepare agenda/materials");
      subtasks.push("Review key points");
      subtasks.push("Practice delivery");
      subtasks.push("Gather feedback");
    }
    // Assignment tasks
    else if (
      title.includes("assignment") ||
      title.includes("homework") ||
      category === "academic"
    ) {
      subtasks.push("Read instructions carefully");
      subtasks.push("Complete main work");
      subtasks.push("Review answers");
      subtasks.push("Submit on time");
    }
    // Coding/development tasks
    else if (
      title.includes("code") ||
      title.includes("develop") ||
      title.includes("build") ||
      title.includes("fix bug")
    ) {
      subtasks.push("Plan approach");
      subtasks.push("Write code");
      subtasks.push("Test functionality");
      subtasks.push("Review and refactor");
    }
    // Default subtasks for complex tasks
    else if (isComplex) {
      subtasks.push("Plan approach");
      subtasks.push("Execute main work");
      subtasks.push("Review results");
      subtasks.push("Finalize and submit");
    }

    return subtasks.slice(0, 4); // Max 4 subtasks
  };

  const formatDeadline = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = "6:00 PM"; // Default suggested time

    if (isToday) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;

    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return `${date.toLocaleDateString("en-US", options)} ${timeStr}`;
  };

  const getTimeOfDayIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case "morning":
        return <Sun className="h-4 w-4" />;
      case "afternoon":
        return <Coffee className="h-4 w-4" />;
      case "evening":
        return <Moon className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-muted-foreground";
      case "low":
        return "bg-border";
    }
  };

  const applyAllSuggestions = () => {
    if (!suggestion) return;

    onApplySuggestion({
      priority: suggestion.priority,
      suggestedDeadline: suggestion.suggestedDeadline,
      estimatedTime: suggestion.estimatedTime,
      timeOfDay: suggestion.timeOfDay,
      subtasks: suggestion.subtasks,
    });
  };

  if (!show || !title.trim()) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-4 top-20 z-[100] w-80 max-h-[calc(100vh-6rem)] overflow-hidden hidden lg:block"
      >
        <Card className="border-2 shadow-xl">
          {/* Header */}
          <div className="bg-black dark:bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={
                    isAnalyzing
                      ? { rotate: 360 }
                      : { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }
                  }
                  transition={{
                    duration: isAnalyzing ? 1 : 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Sparkles className="h-5 w-5 text-white dark:text-black" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-sm text-white dark:text-black">
                    AI Assistant
                  </h3>
                  {isAnalyzing && (
                    <p className="text-[10px] text-white/80 dark:text-black/80">
                      Analyzing...
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white dark:text-black hover:bg-white/20 dark:hover:bg-black/20"
                onClick={onHide}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto">
            {suggestion ? (
              <>
                {/* Reasoning */}
                <div className="bg-secondary/50 rounded-lg p-2.5 border text-xs">
                  <p className="text-muted-foreground italic leading-relaxed">
                    {suggestion.reasoning}
                  </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-card rounded-lg p-2.5 border">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        Time
                      </span>
                    </div>
                    <p className="text-xs font-semibold">
                      {suggestion.estimatedTime}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg p-2.5 border">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        Deadline
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-tight">
                      {suggestion.suggestedDeadline}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg p-2.5 border">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Flag className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        Priority
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-2 w-2 rounded-full ${getPriorityColor(
                          suggestion.priority
                        )}`}
                      />
                      <p className="text-xs font-semibold capitalize">
                        {suggestion.priority}
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg p-2.5 border">
                    <div className="flex items-center gap-1.5 mb-1">
                      {getTimeOfDayIcon(suggestion.timeOfDay)}
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        Best Time
                      </span>
                    </div>
                    <p className="text-xs font-semibold capitalize">
                      {suggestion.timeOfDay}
                    </p>
                  </div>
                </div>

                {/* Productivity Tip */}
                {suggestion.productivityTip && (
                  <div className="bg-secondary rounded-lg p-2.5 border">
                    <p className="text-xs leading-relaxed">
                      {suggestion.productivityTip}
                    </p>
                  </div>
                )}

                {/* Subtasks */}
                {suggestion.subtasks.length > 0 && (
                  <div className="bg-card rounded-lg p-2.5 border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ListChecks className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">
                        Suggested Subtasks
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {suggestion.subtasks.map((subtask, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-1.5 text-xs"
                        >
                          <ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">{subtask}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Break Reminder */}
                {suggestion.breakReminder && (
                  <div className="bg-secondary rounded-lg p-2.5 border">
                    <div className="flex items-start gap-1.5">
                      <Coffee className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <p className="text-xs leading-relaxed">
                        <strong>Break Reminder:</strong>{" "}
                        {suggestion.breakReminder}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <Button
                    onClick={applyAllSuggestions}
                    className="w-full h-9 text-xs"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Apply Suggestions
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={onHide}
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      size="sm"
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                      Ignore
                    </Button>
                    <Button
                      onClick={onHide}
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      size="sm"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Hide
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-10 w-10 mb-2" />
                </motion.div>
                <p className="text-xs text-muted-foreground text-center">
                  Keep typing for AI suggestions...
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
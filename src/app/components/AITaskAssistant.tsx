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
  Lightbulb,
} from "lucide-react";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { TaskCategory, TaskPriority } from "../types/task";
import { useTaskAPI } from "../hooks/useTaskAPI";

interface AISuggestion {
  suggested_time: string;
  estimated_duration: string;
  reason: string;
  priority: TaskPriority;
  timeOfDay: "morning" | "afternoon" | "evening";
  productivity_score?: number;
  // Work schedule fields
  work_days?: string[];
  start_time?: string;
  end_time?: string;
  work_type?: string;
}

interface AITaskAssistantProps {
  title: string;
  description: string;
  category: TaskCategory;
  priority?: TaskPriority;
  dueDate?: string;
  onApplySuggestion: (suggestion: Partial<AISuggestion>) => void;
  show: boolean;
  onHide: () => void;
}

export function AITaskAssistant({
  title,
  description,
  category,
  priority = "medium",
  dueDate = "",
  onApplySuggestion,
  show,
  onHide,
}: AITaskAssistantProps) {

  const { analyzeTaskAI, tasks } = useTaskAPI();

  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {

    if (!show || !title.trim()) {
      setSuggestion(null);
      setError(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsAnalyzing(true);
    setError(null);

    debounceTimerRef.current = setTimeout(() => {
      analyzeTask();
    }, 500); // ✅ IMPROVED: Reduced debounce to 500ms for faster response

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };

  }, [title, description, category, priority, dueDate, show]);



  const analyzeTask = async () => {

    try {

      // For work tasks, check for conflicts and suggest alternative times
      if (category === 'work') {
        const conflictFreeSuggestion = findConflictFreeTime();
        if (conflictFreeSuggestion) {
          setSuggestion(conflictFreeSuggestion);
          setIsAnalyzing(false);
          return;
        }
      }

      // ✅ IMPROVED: Pass priority and dueDate to API
      const result = await analyzeTaskAI(title, description, category, priority, dueDate);

      if (result) {

        const aiSuggestion: AISuggestion = {
          suggested_time: result.suggested_time || "18:00",
          estimated_duration: result.estimated_duration || "1–2 hours",
          reason: result.reason || "AI-optimized scheduling",
          priority: result.priority || priority || "medium",
          timeOfDay: result.timeOfDay || getTimeOfDay(result.suggested_time || "18:00"),
          productivity_score: result.productivity_score,
        };

        setSuggestion(aiSuggestion);

      } else {

        const fallback = generateFallback(title, description, category, priority);
        setSuggestion(fallback);

      }

    } catch (error) {

      console.log("AI endpoint failed → using fallback");
      setError("Using smart fallback suggestion");

      const fallback = generateFallback(title, description, category, priority);
      setSuggestion(fallback);

    }

    setIsAnalyzing(false);

  };

  // Find conflict-free time for work schedules
  const findConflictFreeTime = (): AISuggestion | null => {
    // Get all academic tasks
    const academicTasks = tasks.filter(t => t.category === 'academic');
    
    // Common work hours to check
    const workHours = [
      { start: "09:00", end: "17:00", timeOfDay: "morning" as const },
      { start: "10:00", end: "18:00", timeOfDay: "morning" as const },
      { start: "13:00", end: "17:00", timeOfDay: "afternoon" as const },
      { start: "14:00", end: "18:00", timeOfDay: "afternoon" as const },
      { start: "19:00", end: "22:00", timeOfDay: "evening" as const },
    ];

    // Work days (assuming Monday-Friday for now)
    const workDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (const slot of workHours) {
      let hasConflict = false;
      
      for (const day of workDays) {
        for (const academicTask of academicTasks) {
          const academicDate = new Date(academicTask.dueDate);
          const academicDay = academicDate.toLocaleDateString('en-US', { weekday: 'long' });
          
          if (academicDay === day) {
            const academicTime = academicDate.toTimeString().slice(0, 5);
            if (slot.start < academicTime && slot.end > academicTime) {
              hasConflict = true;
              break;
            }
          }
        }
        if (hasConflict) break;
      }
      
      if (!hasConflict) {
        return {
          suggested_time: slot.start,
          estimated_duration: "8 hours",
          reason: `Suggested work schedule (${slot.start}-${slot.end}) avoids conflicts with your academic schedule`,
          priority: priority,
          timeOfDay: slot.timeOfDay,
          productivity_score: 85,
          work_days: workDays,
          start_time: slot.start,
          end_time: slot.end,
          work_type: "office",
        };
      }
    }

    return null; // No conflict-free slot found
  };



  const generateFallback = (
    title: string,
    description: string,
    category: TaskCategory,
    taskPriority: TaskPriority
  ): AISuggestion => {

    const text = (title + " " + description).toLowerCase();

    // ✅ IMPROVED: Smart fallback with working-student context
    let suggestedTime = "18:00";
    let estimatedDuration = "1–2 hours";
    let reason = "";

    // Category-based defaults
    if (category === "academic") {
      suggestedTime = taskPriority === "high" ? "17:00" : "19:00";
      reason = "Evening study sessions give you focused time after classes, ideal for deep work on academic tasks.";
    } else if (category === "work") {
      suggestedTime = taskPriority === "high" ? "09:00" : "14:00";
      reason = "Scheduling work tasks during peak productivity hours helps you deliver quality results.";
    } else {
      suggestedTime = "18:00";
      reason = "I recommend this time to balance productivity with your daily routine.";
    }

    // Priority override
    if (taskPriority === "high") {
      reason = "This is high priority, so I'm scheduling it early when you're most alert.";
    } else if (taskPriority === "low") {
      reason = "Low priority tasks fit best in slower parts of your day or gaps between focus work.";
    }

    // Duration hints
    if (text.includes("call") || text.includes("email") || text.includes("quick")) {
      estimatedDuration = "15–30 minutes";
    } else if (text.includes("project") || text.includes("essay") || text.includes("study")) {
      estimatedDuration = "2–3 hours";
    }

    return {
      suggested_time: suggestedTime,
      estimated_duration: estimatedDuration,
      reason: reason,
      priority: taskPriority,
      timeOfDay: getTimeOfDay(suggestedTime),
    };

  };



  const getTimeOfDay = (timeStr: string): "morning" | "afternoon" | "evening" => {
    try {
      const hour = parseInt(timeStr.split(":")[0]);
      if (hour < 12) return "morning";
      if (hour < 17) return "afternoon";
      return "evening";
    } catch {
      return "evening";
    }
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



  const applyAllSuggestions = () => {

    if (!suggestion) return;

    onApplySuggestion({
      suggested_time: suggestion.suggested_time,
      estimated_duration: suggestion.estimated_duration,
      reason: suggestion.reason,
      priority: suggestion.priority,
      timeOfDay: suggestion.timeOfDay,
    });

  };



  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full lg:w-96"
      >
        <Card className="border-2 shadow-xl h-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">

          {/* Header */}
          <div className="bg-gradient-to-r from-black to-slate-800 dark:from-white dark:to-slate-200 p-4">
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white dark:text-black animate-pulse" />
                <div>
                  <h3 className="font-semibold text-sm text-white dark:text-black">
                    AI Schedule Assistant
                  </h3>
                  {isAnalyzing && (
                    <p className="text-[10px] text-white/70 dark:text-black/70">
                      🔄 Reading your task...
                    </p>
                  )}
                  {error && (
                    <p className="text-[10px] text-yellow-200 dark:text-yellow-300">
                      ⚡ {error}
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
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">

            {!title.trim() ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Lightbulb className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Start typing a task title to get AI suggestions
                </p>
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="animate-spin">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Thinking of the best time...</p>
              </div>
            ) : suggestion ? (

              <>
                {/* ✅ IMPROVED: Human-like explanation */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {suggestion.reason}
                  </p>
                </div>

                {/* ✅ IMPROVED: Suggested time with visual indicator */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {getTimeOfDayIcon(suggestion.timeOfDay)}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Suggested Schedule
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {suggestion.suggested_time}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {suggestion.estimated_duration}
                    </span>
                  </div>
                </div>

                {/* ✅ IMPROVED: Smart details grid */}
                <div className="grid grid-cols-2 gap-2">

                  <div className="bg-card border rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <Flag className="h-3.5 w-3.5" />
                      Priority
                    </div>
                    <p className="text-sm font-semibold capitalize">
                      {suggestion.priority}
                    </p>
                  </div>

                  <div className="bg-card border rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      Category
                    </div>
                    <p className="text-sm font-semibold capitalize">
                      {category}
                    </p>
                  </div>

                </div>

                {/* ✅ IMPROVED: Apply button with action icon */}
                <Button
                  onClick={applyAllSuggestions}
                  className="w-full bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 dark:from-white dark:to-slate-200 dark:hover:from-slate-100 dark:hover:to-slate-300 text-white dark:text-black font-semibold"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Apply Schedule
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>

                {/* Productivity tip if available */}
                {suggestion.productivity_score && (
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    ✨ Productivity Score: {Math.round(suggestion.productivity_score * 100)}%
                  </div>
                )}

              </>

            ) : (
              <div className="flex justify-center py-8">
                <Sparkles className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}

          </div>

        </Card>
      </motion.div>
    </AnimatePresence>
  );

}
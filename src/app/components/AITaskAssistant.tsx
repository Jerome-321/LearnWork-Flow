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
import { useAuth } from "../contexts/AuthContext";

interface AISuggestion {
  suggested_time: string;
  estimated_duration: string;
  reason: string;
  priority: TaskPriority;
  timeOfDay: "morning" | "afternoon" | "evening";
  productivity_score?: number;
}

interface AITaskAssistantProps {
  title: string;
  description: string;
  category: TaskCategory;
  priority?: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  onApplySuggestion: (suggestion: Partial<AISuggestion>) => void;
  show: boolean;
  onHide: () => void;
  onConflictStatus?: (status: { conflict: boolean; message: string }) => void;
  autoAnalyze?: boolean; // if true, run analysis during typing (controlled by parent)
}

export function AITaskAssistant({
  title,
  description,
  category,
  priority = "medium",
  dueDate = "",
  dueTime = "",
  onApplySuggestion,
  show,
  onHide,
  onConflictStatus,
  autoAnalyze = false,
}: AITaskAssistantProps) {
  const { getAccessToken } = useAuth();

  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [conflictWarning, setConflictWarning] = useState<{
    taskTitle: string;
    taskTime: string;
    conflictWith: string;
    conflictTime: string;
    suggestedTime: string;
    reason: string;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!autoAnalyze) {
      return; // submit-only flow: no live analysis while typing
    }

    if (!show) {
      setSuggestion(null);
      setError(null);
      setConflictWarning(null);
      return;
    }

    // Show suggestions as soon as user has basic info (title OR category)
    if (!title.trim() && !category) {
      setSuggestion(null);
      setError(null);
      setConflictWarning(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsAnalyzing(true);
    setError(null);

    // Show suggestions immediately when user starts typing, even with incomplete data
    debounceTimerRef.current = setTimeout(() => {
      analyzeTask();
    }, 200); // Even more responsive for during-input suggestions

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, description, category, priority, dueDate, dueTime, show]);

  const analyzeTask = async () => {
    try {
      setClarifyingQuestions([]);
      setConflictWarning(null);

      // Provide suggestions even with minimal information
      const hasBasicInfo = title.trim() || category;
      if (!hasBasicInfo) {
        setSuggestion(null);
        setIsAnalyzing(false);
        return;
      }
      const hasScheduleInfo = dueDate && dueTime;
      const hasDescription = description && description.trim().length > 0;

      // Show clarifying questions for missing critical info
      const missing: string[] = [];
      if (!dueDate) missing.push("What day should this task happen?");
      if (!dueTime) missing.push("What time should it start?");
      if (!hasDescription) missing.push("How long will this task take?");

      // Still show questions but don't block suggestions
      if (missing.length > 0) {
        setClarifyingQuestions(missing.slice(0, 2));
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const token = getAccessToken();
      const payload = {
        title: title || `${category || 'personal'} task`,
        description: description || `${category || 'personal'} task`,
        category: category || "personal",
        priority: priority || "medium",
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        dueTime: dueTime || "18:00",
        estimatedDuration: hasDescription ? (description.length > 100 ? 120 : 60) : 60,
      };

      // Backend conflict check always runs (helpful even if AI call fails)
      let scheduleData: any = null;
      try {
        const scheduleResponse = await fetch(
          `${import.meta.env.VITE_API_URL || "/api"}/tasks/schedule_suggestion/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
            signal: abortControllerRef.current?.signal,
          }
        );

        if (scheduleResponse.ok) {
          scheduleData = await scheduleResponse.json();
        }
      } catch (err) {
        // no action, conflict check is optional
      }

      if (scheduleData) {
        if (scheduleData.type === "conflict" && scheduleData.conflict) {
          const conflict = scheduleData.conflict;
          setConflictWarning({
            taskTitle: conflict.task || title,
            taskTime: conflict.scheduled_time || `${dueTime || "TBD"} - ${formatTime12Hour(dueTime || "18:00")}`,
            conflictWith: conflict.work_schedule || "Work schedule",
            conflictTime: conflict.work_schedule_time || "TBD",
            suggestedTime: scheduleData.suggested_time || "18:00",
            reason: scheduleData.reason || "Conflict detected with your schedule",
          });

          setSuggestion((prev) => ({
            ...(prev || {
              suggested_time: "18:00",
              estimated_duration: "1–2 hours",
              reason: "Review this schedule for conflicts",
              priority: priority || "medium",
              timeOfDay: getTimeOfDay(dueTime || "18:00"),
            }),
            suggested_time: scheduleData.suggested_time || prev?.suggested_time || "18:00",
            reason: scheduleData.reason || prev?.reason || "Conflict detected with your schedule",
          }));

          onConflictStatus?.({
            conflict: true,
            message: `${conflict.work_schedule || "Conflict"} (${conflict.work_schedule_time || "TBD"})`,
          });
        } else {
          setConflictWarning(null);
          onConflictStatus?.({
            conflict: false,
            message: "No conflict detected",
          });

          if (scheduleData.type === "suggestion") {
            setSuggestion((prev) => ({
              ...(prev || {}),
              suggested_time: scheduleData.suggested_time || prev?.suggested_time || "14:00",
              estimated_duration: scheduleData.estimated_duration || prev?.estimated_duration || "1 hour",
              reason: scheduleData.reason || prev?.reason || "Schedule optimized for availability",
              priority: scheduleData.priority || prev?.priority || (priority || "medium"),
              timeOfDay: scheduleData.timeOfDay || prev?.timeOfDay || getTimeOfDay(scheduleData.suggested_time || dueTime || "18:00"),
              productivity_score: scheduleData.productivity_score || prev?.productivity_score || 0.8,
            }));
          }
        }
      }

      // AI analysis call remains, but should not block conflict display
      let aiResult: any = null;
      try {
        const aiResponse = await fetch(
          `${import.meta.env.VITE_API_URL || "/api"}/ai/analyze/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
            signal: abortControllerRef.current?.signal,
          }
        );
        if (aiResponse.ok) {
          aiResult = await aiResponse.json();
        }
      } catch (err) {
        aiResult = null;
      }

      if (aiResult) {
        const aiSuggestion: AISuggestion = {
          suggested_time: aiResult.suggested_time || formatTime12Hour(dueTime || "18:00"),
          estimated_duration: aiResult.estimated_duration || "1 hour",
          reason: aiResult.reason || "Schedule optimized for productivity",
          priority: aiResult.priority || priority || "medium",
          timeOfDay: aiResult.timeOfDay || getTimeOfDay(aiResult.suggested_time || dueTime || "18:00"),
          productivity_score: aiResult.productivity_score || 0.8,
        };
        setSuggestion(aiSuggestion);
        setError(null);
      } else if (!scheduleData || scheduleData.type !== "conflict") {
        // fallback only if no conflict and no AI suggestion produced
        setError("Using smart fallback");
        setSuggestion(generateFallback(title, description, category, priority));
      }

    } catch (err: any) {
      if (err.name === "AbortError") {
        // Request was cancelled, don't update state
        return;
      }
      console.error("AI analysis error:", err);
      setError("Using smart fallback");
      const fallback = generateFallback(title, description, category, priority);
      setSuggestion(fallback);
      onConflictStatus?.({
        conflict: false,
        message: "Unable to analyze schedule (using fallback)",
      });
    }
    setIsAnalyzing(false);
  };

  const generateFallback = (
    title: string,
    description: string,
    category: TaskCategory,
    taskPriority: TaskPriority
  ): AISuggestion => {
    let suggestedTime = "18:00";
    let estimatedDuration = "1–2 hours";
    let reason = "";

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

    if (taskPriority === "high") {
      reason = "This is high priority, so I'm scheduling it early when you're most alert.";
    } else if (taskPriority === "low") {
      reason = "Low priority tasks fit best in slower parts of your day or gaps between focus work.";
    }

    const text = (title + " " + description).toLowerCase();
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

  const formatTime12Hour = (timeStr: string): string => {
    if (!timeStr) return "";
    const [hourStr, minStr] = timeStr.split(":");
    if (!hourStr || !minStr) return timeStr;

    let hour = parseInt(hourStr, 10);
    const minute = minStr;
    const period = hour >= 12 ? "PM" : "AM";
    if (hour === 0) hour = 12;
    if (hour > 12) hour -= 12;

    return `${hour}:${minute} ${period}`;
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
        className="w-full h-full min-h-0 max-h-full flex flex-col"
      >
        <Card className="border-2 shadow-xl h-full min-h-0 flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden">
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
                      Reading your task...
                    </p>
                  )}
                  {error && (
                    <p className="text-[10px] text-yellow-200 dark:text-yellow-300">
                      ⚡ {error}
                    </p>
                  )}
                  {!isAnalyzing && !error && suggestion && (
                    <p className="text-[10px] text-white/70 dark:text-black/70">
                      Suggestions ready!
                    </p>
                  )}
                  {!isAnalyzing && !error && !suggestion && clarifyingQuestions.length > 0 && (
                    <p className="text-[10px] text-white/70 dark:text-black/70">
                      Gathering insights...
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
          <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0">
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
            ) : clarifyingQuestions.length > 0 && !suggestion ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      Quick Suggestions
                    </span>
                  </div>
                  <div className="space-y-2">
                    {clarifyingQuestions.map((question, index) => (
                      <div key={index} className="text-xs text-slate-700 dark:text-slate-300">
                        💡 {question}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Fill in these details to get personalized scheduling suggestions
                  </p>
                </div>

                {/* Show basic suggestions even with incomplete data */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Basic Recommendation
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    Based on your task type, I recommend scheduling this during:
                  </div>
                  <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {category === 'academic' ? 'Evening study hours (6-9 PM)' :
                     category === 'work' ? 'Peak productivity time (9 AM-12 PM)' :
                     'Flexible personal time'}
                  </div>
                </div>
              </div>
            ) : conflictWarning ? (
              <>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="font-semibold text-sm text-red-700 dark:text-red-300">
                    ⚠ Conflict Detected
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Task: {conflictWarning.taskTitle}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Time: {conflictWarning.taskTime}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Conflicts with: {conflictWarning.conflictWith}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Time: {conflictWarning.conflictTime}
                  </p>
                  <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-xs">Suggestion</p>
                    <p className="text-xs">Move to {formatTime12Hour(conflictWarning.suggestedTime)}</p>
                  </div>
                </div>

                {/* Also render the suggestion if available */}
                {suggestion && (
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
                    <p className="text-xs text-slate-700 dark:text-slate-300">{suggestion.reason}</p>
                  </div>
                )}
              </>
            ) : suggestion ? (
              <>
                {/* Explanation */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {suggestion.reason}
                  </p>
                </div>

                {/* Suggested time */}
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

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-card border rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <Flag className="h-3.5 w-3.5" />
                      Priority
                    </div>
                    <p className="text-sm font-semibold capitalize">{suggestion.priority}</p>
                  </div>

                  <div className="bg-card border rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      Category
                    </div>
                    <p className="text-sm font-semibold capitalize">{category}</p>
                  </div>
                </div>

                {/* Apply button */}
                <Button
                  onClick={applyAllSuggestions}
                  className="w-full bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 dark:from-white dark:to-slate-200 dark:hover:from-slate-100 dark:hover:to-slate-300 text-white dark:text-black font-semibold"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Apply Schedule
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>

                {/* Productivity tip */}
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

import { useState } from "react";
import { useOutletContext } from "react-router";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Bell, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Task } from "../types/task";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { TaskActions } from "../components/TaskActions";
import { useWorkScheduleAPI } from "../hooks/useWorkScheduleAPI";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { cn } from "../components/ui/utils";

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  tasks: Task[];
}

export function CalendarPage() {
  const { tasks, setSelectedTaskId } = useOutletContext<OutletContext>();
  const { schedules, fetchSchedules } = useWorkScheduleAPI();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Pull-to-refresh for detail panel
  const {
    isPulling,
    pullDistance,
    isRefreshing,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  } = usePullToRefresh({
    onRefresh: async () => {
      // Refresh work schedules
      await fetchSchedules();
    },
    threshold: 80
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getWeekDays = (date: Date) => {
    const days = [];
    const current = new Date(date);
    current.setDate(current.getDate() - current.getDay());

    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const toLocalDateStr = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const formatTime12Hour = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${suffix}`;
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = toLocalDateStr(date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    
    const dayTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      return toLocalDateStr(d) === dateStr;
    });

    // Add work schedules for this day of the week
    const daySchedules = schedules.filter((schedule) => 
      schedule.work_days.includes(dayName)
    );

    return { tasks: dayTasks, schedules: daySchedules };
  };

  const isTaskDueSoon = (task: Task) => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 0 && hoursDiff <= 24; // Due within 24 hours
  };

  const isTaskOverdue = (task: Task) => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return dueDate < now && !task.completed;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200';
      case 'work':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200';
      case 'personal':
        return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200';
    }
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const selectedDateData = selectedDate ? getTasksForDate(selectedDate) : { tasks: [], schedules: [] };

  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      <Tabs value={view} onValueChange={(v) => { setView(v as "week" | "month"); setSelectedDate(null); }}>
        <div className="border-b bg-card backdrop-blur-sm flex-shrink-0">
          <div className="flex flex-col gap-2 p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 lg:h-11 lg:w-11 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarIcon className="h-4 w-4 lg:h-6 lg:w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-2xl font-bold text-foreground">Calendar</h1>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    {currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="hidden lg:block">
                <TaskActions />
              </div>
            </div>
            
            {/* Mobile controls */}
            <div className="flex items-center justify-between gap-2">
              <TabsList className="bg-muted">
                <TabsTrigger value="week" className="text-xs lg:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Week
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs lg:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Month
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    view === "week" ? navigateWeek(-1) : navigateMonth(-1)
                  }
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    view === "week" ? navigateWeek(1) : navigateMonth(1)
                  }
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-2 lg:p-6 pb-64 overflow-auto" style={{ minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain', flex: 1 } as React.CSSProperties}>
          <div className="max-w-6xl mx-auto" style={{ minHeight: 'fit-content' }}>

            {/* Week View */}
            <TabsContent value="week" className="m-0">
              <div className="overflow-x-auto -mx-2 px-2 lg:mx-0 lg:px-0">
                <div className="min-w-[320px] grid grid-cols-7 gap-1 lg:gap-3">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div
                      key={idx}
                      className="p-1 lg:p-3 text-center text-[10px] lg:text-sm font-semibold text-muted-foreground uppercase"
                    >
                      {day}
                    </div>
                  ))}

                {weekDays.map((day, index) => {
                  const dayData = getTasksForDate(day);
                  const dayTasks = dayData.tasks;
                  const daySchedules = dayData.schedules;
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.toDateString();
                  const totalItems = dayTasks.length + daySchedules.length;
                  const hasOverdue = dayTasks.some(t => isTaskOverdue(t));
                  const hasDueSoon = dayTasks.some(t => isTaskDueSoon(t));

                  return (
                    <Card
                      key={index}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={cn(
                        "min-h-[80px] lg:min-h-[180px] overflow-hidden transition-all cursor-pointer",
                        isSelected && "border-2 border-primary ring-2 ring-primary/20 shadow-lg",
                        !isSelected && isToday && "border-2 border-primary bg-primary/5 shadow-lg",
                        !isSelected && !isToday && hasOverdue && "border-l-4 border-l-red-500",
                        !isSelected && !isToday && !hasOverdue && hasDueSoon && "border-l-4 border-l-amber-500",
                        !isSelected && !isToday && !hasOverdue && !hasDueSoon && "hover:shadow-md"
                      )}
                    >
                      <div className="p-1.5 lg:p-3 border-b bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "text-sm lg:text-lg font-bold",
                              isToday && "text-primary",
                              !isToday && "text-foreground"
                            )}
                          >
                            {day.getDate()}
                          </div>
                          <div className="flex items-center gap-1">
                            {isToday && <div className="h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full bg-primary" />}
                            {hasOverdue && <AlertCircle className="h-3 w-3 text-red-500" />}
                            {!hasOverdue && hasDueSoon && <Bell className="h-3 w-3 text-amber-500" />}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-1 lg:p-2 space-y-0.5 lg:space-y-1">
                        {totalItems > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {/* Mobile - show category dots */}
                            <div className="lg:hidden flex flex-wrap gap-1 p-1">
                              {dayTasks.slice(0, 6).map((task, i) => (
                                <div 
                                  key={i} 
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    task.category === 'academic' && "bg-purple-500",
                                    task.category === 'work' && "bg-blue-500",
                                    task.category === 'personal' && "bg-green-500",
                                    task.completed && "opacity-50"
                                  )}
                                />
                              ))}
                              {daySchedules.slice(0, 2).map((_, i) => (
                                <div key={`sched-${i}`} className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              ))}
                              {totalItems > 8 && (
                                <span className="text-[8px] text-muted-foreground">+{totalItems - 8}</span>
                              )}
                            </div>
                            
                            {/* Desktop - show task cards */}
                            <div className="hidden lg:block space-y-1 max-h-[120px] overflow-y-auto">
                              {dayTasks.slice(0, 2).map((task) => (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "w-full rounded-md p-1.5 text-left text-[10px] border",
                                    getCategoryColor(task.category),
                                    task.completed && "opacity-60 line-through"
                                  )}
                                >
                                  <div className="flex items-center gap-1">
                                    {isTaskOverdue(task) && <AlertCircle className="h-2.5 w-2.5 text-red-500 flex-shrink-0" />}
                                    {!isTaskOverdue(task) && isTaskDueSoon(task) && <Bell className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />}
                                    <div className="font-medium truncate flex-1">{task.title}</div>
                                  </div>
                                  <div className="text-[9px] text-muted-foreground mt-0.5">
                                    {new Date(task.dueDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                  </div>
                                </div>
                              ))}
                              {daySchedules.map((schedule) => (
                                <div
                                  key={schedule.id}
                                  className="w-full rounded-md p-1.5 text-left text-[10px] bg-red-500/10 border border-red-200"
                                >
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5 text-red-600 flex-shrink-0" />
                                    <div className="font-medium truncate">{formatTime12Hour(schedule.start_time)} - {formatTime12Hour(schedule.end_time)}</div>
                                  </div>
                                </div>
                              ))}
                              {totalItems > 3 && (
                                <div className="text-[10px] text-muted-foreground text-center">+{totalItems - 3} more</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="hidden lg:flex items-center justify-center h-[100px] text-muted-foreground text-[10px]">
                            No tasks
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Selected date task list for Week View */}
            {selectedDate && (
              <div
                className="mt-6 border rounded-lg bg-card shadow-lg max-h-[60vh] lg:max-h-[500px] overflow-y-auto relative"
                data-pull-to-refresh
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                  minHeight: 0,
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain',
                  WebkitAppearance: 'none'
                } as React.CSSProperties}
              >
                {/* Pull-to-refresh indicator */}
                {isPulling && (
                  <div
                    className="absolute top-0 left-0 right-0 flex justify-center items-center bg-gradient-to-b from-primary/10 to-transparent transition-all"
                    style={{
                      height: `${Math.min(pullDistance, 80)}px`,
                      zIndex: 10
                    }}
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4 text-primary transition-transform",
                        isRefreshing && "animate-spin"
                      )}
                      style={{
                        transform: `rotate(${Math.min(pullDistance / 2, 180)}deg)`
                      }}
                    />
                  </div>
                )}

                <div className="p-4" style={{ paddingTop: isPulling ? `${Math.min(pullDistance, 80) + 16}px` : '16px' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedDateData.tasks.length} task{selectedDateData.tasks.length !== 1 ? 's' : ''} · {selectedDateData.schedules.length} schedule{selectedDateData.schedules.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedDateData.tasks.length === 0 && selectedDateData.schedules.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No tasks or schedules for this day.</p>
                      {!isPulling && <p className="text-xs text-muted-foreground mt-2">Pull down to refresh</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                    {selectedDateData.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          "w-full rounded-lg p-3 text-left text-sm transition-all hover:shadow-md border",
                          getCategoryColor(task.category),
                          task.completed && "opacity-60"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className={cn("font-medium", task.completed && "line-through")}>
                              {task.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">{task.priority}</Badge>
                              <Badge variant="outline" className="text-xs capitalize">{task.category}</Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {selectedDateData.schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="w-full rounded-lg p-3 text-left text-sm bg-red-500/10 border border-red-200"
                      >
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-red-700 dark:text-red-300">
                              {schedule.job_title || "Work Schedule"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                              <span>{formatTime12Hour(schedule.start_time)} - {formatTime12Hour(schedule.end_time)}</span>
                              <Badge variant="outline" className="text-xs capitalize">work</Badge>
                              <Badge variant="outline" className="text-xs capitalize">{schedule.work_type}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Month View */}
          <TabsContent value="month" className="m-0">
            <div className="overflow-x-auto -mx-2 px-2 lg:mx-0 lg:px-0">
              <div className="min-w-[320px] grid grid-cols-7 gap-1 lg:gap-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                  <div
                    key={idx}
                    className="p-1 lg:p-3 text-center text-[10px] lg:text-sm font-semibold text-muted-foreground uppercase"
                  >
                    {day}
                  </div>
                ))}

                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="min-h-[50px] lg:min-h-[80px]" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    index + 1
                  );
                  const dayData = getTasksForDate(day);
                  const dayTasks = dayData.tasks;
                  const daySchedules = dayData.schedules;
                  const totalItems = dayTasks.length + daySchedules.length;
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.toDateString();
                  const hasOverdue = dayTasks.some(t => isTaskOverdue(t));
                  const hasDueSoon = dayTasks.some(t => isTaskDueSoon(t));

                  return (
                    <Card
                      key={index}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={cn(
                        "min-h-[50px] lg:min-h-[80px] p-1.5 lg:p-3 cursor-pointer transition-all hover:shadow-md relative",
                        isSelected && "border-2 border-primary ring-2 ring-primary/20 shadow-lg",
                        !isSelected && isToday && "border-2 border-primary bg-primary/5",
                        !isSelected && !isToday && hasOverdue && "border-l-4 border-l-red-500",
                        !isSelected && !isToday && !hasOverdue && hasDueSoon && "border-l-4 border-l-amber-500",
                        !isSelected && !isToday && !hasOverdue && !hasDueSoon && totalItems > 0 && "bg-muted/50"
                      )}
                    >
                      {/* Reminder badge */}
                      {(hasOverdue || hasDueSoon) && (
                        <div className="absolute top-1 right-1">
                          {hasOverdue ? (
                            <AlertCircle className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-red-500" />
                          ) : (
                            <Bell className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-amber-500" />
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center justify-center h-full gap-1">
                        <div
                          className={cn(
                            "text-xs lg:text-sm font-bold",
                            (isToday || isSelected) && "text-primary",
                            !(isToday || isSelected) && "text-foreground"
                          )}
                        >
                          {index + 1}
                        </div>
                        {totalItems > 0 && (
                          <div className="flex flex-wrap gap-0.5 justify-center">
                            {dayTasks.slice(0, 3).map((task, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  "h-1 w-1 lg:h-1.5 lg:w-1.5 rounded-full",
                                  task.category === 'academic' && "bg-purple-500",
                                  task.category === 'work' && "bg-blue-500",
                                  task.category === 'personal' && "bg-green-500",
                                  task.completed && "opacity-50"
                                )}
                              />
                            ))}
                            {daySchedules.slice(0, 1).map((_, i) => (
                              <div key={`sched-${i}`} className="h-1 w-1 lg:h-1.5 lg:w-1.5 rounded-full bg-red-500" />
                            ))}
                            {totalItems > 4 && (
                              <span className="text-[8px] text-muted-foreground">+{totalItems - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Selected date task list */}
            {selectedDate && (
              <div
                className="mt-6 border rounded-lg bg-card shadow-lg max-h-[60vh] lg:max-h-[500px] overflow-y-auto relative"
                data-pull-to-refresh
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                  minHeight: 0,
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain',
                  WebkitAppearance: 'none'
                } as React.CSSProperties}
              >
                {/* Pull-to-refresh indicator */}
                {isPulling && (
                  <div
                    className="absolute top-0 left-0 right-0 flex justify-center items-center bg-gradient-to-b from-primary/10 to-transparent transition-all"
                    style={{
                      height: `${Math.min(pullDistance, 80)}px`,
                      zIndex: 10
                    }}
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4 text-primary transition-transform",
                        isRefreshing && "animate-spin"
                      )}
                      style={{
                        transform: `rotate(${Math.min(pullDistance / 2, 180)}deg)`
                      }}
                    />
                  </div>
                )}

                <div className="p-4" style={{ paddingTop: isPulling ? `${Math.min(pullDistance, 80) + 16}px` : '16px' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                      })}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedDateData.tasks.length} task{selectedDateData.tasks.length !== 1 ? 's' : ''} · {selectedDateData.schedules.length} schedule{selectedDateData.schedules.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {selectedDateData.tasks.length === 0 && selectedDateData.schedules.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No tasks or schedules for this day.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Overdue tasks */}
                    {selectedDateData.tasks.filter(t => isTaskOverdue(t)).length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <h4 className="text-sm font-semibold text-red-600">Overdue</h4>
                        </div>
                        <div className="space-y-2">
                          {selectedDateData.tasks.filter(t => isTaskOverdue(t)).map((task) => (
                            <button
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className={cn(
                                "w-full rounded-lg p-3 text-left text-sm transition-all hover:shadow-md border-l-4",
                                getCategoryColor(task.category),
                                "border-l-red-500"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-medium">{task.title}</div>
                                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(task.dueDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                    </span>
                                    <Badge variant="outline" className="text-xs capitalize">{task.priority}</Badge>
                                    <Badge variant="outline" className="text-xs capitalize">{task.category}</Badge>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Due soon tasks */}
                    {selectedDateData.tasks.filter(t => !isTaskOverdue(t) && isTaskDueSoon(t)).length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="h-4 w-4 text-amber-500" />
                          <h4 className="text-sm font-semibold text-amber-600">Due Soon</h4>
                        </div>
                        <div className="space-y-2">
                          {selectedDateData.tasks.filter(t => !isTaskOverdue(t) && isTaskDueSoon(t)).map((task) => (
                            <button
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className={cn(
                                "w-full rounded-lg p-3 text-left text-sm transition-all hover:shadow-md border-l-4",
                                getCategoryColor(task.category),
                                "border-l-amber-500"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-medium">{task.title}</div>
                                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(task.dueDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                    </span>
                                    <Badge variant="outline" className="text-xs capitalize">{task.priority}</Badge>
                                    <Badge variant="outline" className="text-xs capitalize">{task.category}</Badge>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other tasks */}
                    {selectedDateData.tasks.filter(t => !isTaskOverdue(t) && !isTaskDueSoon(t)).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Tasks</h4>
                        <div className="space-y-2">
                          {selectedDateData.tasks.filter(t => !isTaskOverdue(t) && !isTaskDueSoon(t)).map((task) => (
                            <button
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className={cn(
                                "w-full rounded-lg p-3 text-left text-sm transition-all hover:shadow-md border",
                                getCategoryColor(task.category),
                                task.completed && "opacity-60"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className={cn("font-medium", task.completed && "line-through")}>
                                    {task.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(task.dueDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                    </span>
                                    <Badge variant="outline" className="text-xs capitalize">{task.priority}</Badge>
                                    <Badge variant="outline" className="text-xs capitalize">{task.category}</Badge>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Work schedules */}
                    {selectedDateData.schedules.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Work Schedule</h4>
                        <div className="space-y-2">
                          {selectedDateData.schedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className="w-full rounded-lg p-3 text-left text-sm bg-red-500/10 border border-red-200"
                            >
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium text-red-700 dark:text-red-300">
                                    {schedule.job_title || "Work Schedule"}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                    <span>{formatTime12Hour(schedule.start_time)} - {formatTime12Hour(schedule.end_time)}</span>
                                    <Badge variant="outline" className="text-xs capitalize">work</Badge>
                                    <Badge variant="outline" className="text-xs capitalize">{schedule.work_type}</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </div>
    </Tabs>

    {/* Task Detail Modal */}
    {selectedTask && (
      <TaskActions
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    )}
  </div>
);
}

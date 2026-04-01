import { useState } from "react";
import { useOutletContext } from "react-router";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { Task } from "../types/task";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { TaskActions } from "../components/TaskActions";

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  tasks: Task[];
}

export function CalendarPage() {
  const { tasks, setSelectedTaskId } = useOutletContext<OutletContext>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const getTasksForDate = (date: Date) => {
    const dateStr = toLocalDateStr(date);
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      return toLocalDateStr(d) === dateStr;
    });
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
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-card backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <TaskActions />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={view} onValueChange={(v) => { setView(v as "week" | "month"); setSelectedDate(null); }}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-muted">
                <TabsTrigger value="week" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Week
                </TabsTrigger>
                <TabsTrigger value="month" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Month
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    view === "week" ? navigateWeek(-1) : navigateMonth(-1)
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    view === "week" ? navigateWeek(1) : navigateMonth(1)
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Week View */}
            <TabsContent value="week" className="m-0">
              <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                <div className="min-w-[700px] grid grid-cols-7 gap-3">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="p-3 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {day}
                    </div>
                  ))}

                {weekDays.map((day, index) => {
                  const dayTasks = getTasksForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <Card
                      key={index}
                      className={`min-h-[220px] overflow-hidden transition-all ${
                        isToday
                          ? "border-2 border-primary bg-primary/5"
                          : "hover:shadow-md"
                      }`}
                    >
                      <div className="p-3 border-b bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div
                            className={`text-lg font-bold ${
                              isToday ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {day.getDate()}
                          </div>
                          {isToday && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                      
                      <div className="p-2 space-y-1 max-h-[140px] overflow-y-auto">
                        {dayTasks.length > 0 ? (
                          dayTasks.map((task) => (
                            <button
                              key={task.id}
                              onClick={() => setSelectedTaskId(task.id)}
                              className={`w-full rounded-md p-2 text-left text-xs transition-all hover:shadow-sm ${
                                task.completed
                                  ? "bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-300"
                                  : "bg-primary/10 hover:bg-primary/20 text-foreground"
                              }`}
                            >
                              <div className={`font-medium truncate ${
                                task.completed ? "line-through" : ""
                              }`}>
                                {task.title}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {new Date(task.dueDate).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-[120px] text-muted-foreground text-xs">
                            No tasks
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Month View */}
          <TabsContent value="month" className="m-0">
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
              <div className="min-w-[700px] grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {day}
                  </div>
                ))}

                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="min-h-[100px]" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    index + 1
                  );
                  const dayTasks = getTasksForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.toDateString();

                  return (
                    <Card
                      key={index}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`min-h-[100px] p-3 cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? "border-2 border-primary ring-2 ring-primary/20"
                          : isToday
                          ? "border-2 border-primary bg-primary/5"
                          : dayTasks.length > 0
                          ? "bg-muted/50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`text-sm font-bold ${
                            isToday || isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                        {isToday && !isSelected && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      {dayTasks.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold"
                        >
                          {dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Selected date task list */}
            {selectedDate && (
              <div className="mt-6 border rounded-lg bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {selectedDateTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks for this day.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`w-full rounded-md p-3 text-left text-sm transition-all hover:shadow-sm ${
                          task.completed
                            ? "bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-300"
                            : "bg-primary/10 hover:bg-primary/20 text-foreground"
                        }`}
                      >
                        <div className={`font-medium ${task.completed ? "line-through" : ""}`}>
                          {task.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>{new Date(task.dueDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                          <Badge variant="outline" className="text-xs capitalize">{task.priority}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{task.category}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

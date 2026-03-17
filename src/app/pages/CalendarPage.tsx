import { useState } from "react";
import { useOutletContext } from "react-router";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { AddTaskButton } from "../components/AddTaskButton";

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

export function CalendarPage() {
  const { tasks } = useTaskAPI();
  const { setSelectedTaskId } = useOutletContext<OutletContext>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");

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

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return tasks.filter(
      (task) => new Date(task.dueDate).toDateString() === dateStr
    );
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-card shadow-sm">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
              <CalendarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Calendar</h1>
              <p className="text-sm text-muted-foreground">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <AddTaskButton />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={view} onValueChange={(v) => setView(v as "week" | "month")}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
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
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {weekDays.map((day, index) => {
                  const dayTasks = getTasksForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={`min-h-[200px] rounded-lg border bg-card p-2 ${
                        isToday ? "border-primary border-2" : ""
                      }`}
                    >
                      <div
                        className={`mb-2 text-center text-sm font-medium ${
                          isToday ? "text-primary" : ""
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className="w-full rounded p-2 text-left text-xs hover:bg-accent transition-colors"
                          >
                            <div className="font-medium truncate">{task.title}</div>
                            <div className="text-muted-foreground">
                              {new Date(task.dueDate).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Month View */}
            <TabsContent value="month" className="m-0">
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground"
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

                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] rounded-lg border bg-card p-2 ${
                        isToday ? "border-primary border-2" : ""
                      }`}
                    >
                      <div
                        className={`mb-1 text-sm font-medium ${
                          isToday ? "text-primary" : ""
                        }`}
                      >
                        {index + 1}
                      </div>
                      {dayTasks.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayTasks.length}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
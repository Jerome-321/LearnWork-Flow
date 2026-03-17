import { useState } from "react";
import { useOutletContext } from "react-router";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { AddTaskButton } from "../components/AddTaskButton";

// Google-style color palette
const COLORS = {
  primary: {
    blue: "#2563eb",
    lightBlue: "#3b82f6",
    lighter: "#dbeafe",
    pale: "#f0f9ff",
  },
  secondary: {
    gray: "#9ca3af",
    lightGray: "#e5e7eb",
    lighter: "#f3f4f6",
  },
  accent: {
    teal: "#14b8a6",
    green: "#10b981",
    amber: "#f59e0b",
  },
};

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
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Calendar
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
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
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-gray-100 dark:bg-gray-800">
                <TabsTrigger 
                  value="week"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
                >
                  Week
                </TabsTrigger>
                <TabsTrigger 
                  value="month"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
                >
                  Month
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    view === "week" ? navigateWeek(-1) : navigateMonth(-1)
                  }
                  className="hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    view === "week" ? navigateWeek(1) : navigateMonth(1)
                  }
                  className="hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Week View */}
            <TabsContent value="week" className="m-0">
              <div className="grid grid-cols-7 gap-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide"
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
                      className={`min-h-[220px] rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
                        isToday
                          ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2 border-blue-300 dark:border-blue-700"
                          : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-slate-900 dark:to-transparent">
                        <div className="flex items-center justify-between">
                          <div
                            className={`text-lg font-bold ${
                              isToday
                                ? "text-blue-600 dark:text-blue-300"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {day.getDate()}
                          </div>
                          {isToday && (
                            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-teal-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="p-2 space-y-1 max-h-[140px] overflow-y-auto">
                        {dayTasks.length > 0 ? (
                          dayTasks.map((task) => (
                            <button
                              key={task.id}
                              onClick={() => setSelectedTaskId(task.id)}
                              className={`w-full rounded-lg p-2 text-left text-xs transition-all hover:scale-105 ${
                                task.completed
                                  ? "bg-green-100 dark:bg-green-950 hover:bg-green-200 dark:hover:bg-green-900"
                                  : "bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 hover:from-blue-200 hover:to-blue-100 dark:hover:from-blue-900 dark:hover:to-blue-800"
                              }`}
                            >
                              <div className="font-medium truncate text-gray-900 dark:text-white">
                                {task.title}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400 text-xs">
                                {new Date(task.dueDate).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-[120px] text-gray-400 dark:text-gray-600 text-xs">
                            No tasks
                          </div>
                        )}
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
                    className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                  >
                    {day}
                  </div>
                ))}

                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="min-h-[120px]" />
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
                      className={`min-h-[120px] rounded-xl shadow-sm hover:shadow-md transition-all p-3 cursor-pointer ${
                        isToday
                          ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2 border-blue-300 dark:border-blue-700"
                          : dayTasks.length > 0
                          ? "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`text-sm font-bold ${
                            isToday
                              ? "text-blue-600 dark:text-blue-300"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {index + 1}
                        </div>
                        {isToday && (
                          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-teal-500" />
                        )}
                      </div>
                      {dayTasks.length > 0 && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs font-semibold ${
                            isToday
                              ? "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
                              : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}
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
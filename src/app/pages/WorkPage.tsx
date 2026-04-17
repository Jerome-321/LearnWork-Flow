import { useOutletContext } from "react-router";
import { TaskList } from "../components/TaskList";
import { TaskActions } from "../components/TaskActions";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Task, WorkSchedule } from "../types/task";
import { useWorkScheduleAPI } from "../hooks/useWorkScheduleAPI";
import { Briefcase, Loader2 } from "lucide-react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tasks: Task[];
  loading: boolean;
}

export function WorkPage() {
  const { selectedTaskId, setSelectedTaskId, searchQuery, tasks, loading } = useOutletContext<OutletContext>();
  const { schedules } = useWorkScheduleAPI();

  const handleRefresh = async () => {
    console.log('Pull to refresh: Starting refresh...');
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('Pull to refresh: Refresh complete!');
  };

  const { isPulling, pullDistance, isRefreshing, isOnline, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  const workTasks = tasks.filter((t) => t.category === "work");
  const academicTasks = tasks.filter((t) => t.category === "academic");

  const dayAbbrev: Record<string, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  const displayDays = (days: string[]) => days.map((d) => dayAbbrev[d] || d.slice(0, 3)).join(", ");

  const formatTime12Hour = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${suffix}`;
  };
  
  const filteredTasks = workTasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  // Check for schedule conflicts
  const getConflicts = (workTask: Task) => {
    if (!workTask.work_days || !workTask.start_time || !workTask.end_time) return [];

    const conflicts: Task[] = [];
    
    academicTasks.forEach(academicTask => {
      const academicDate = new Date(academicTask.dueDate);
      const academicDay = academicDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (workTask.work_days.includes(academicDay)) {
        const academicTime = academicDate.toTimeString().slice(0, 5);
        if (academicTime >= workTask.start_time && academicTime <= workTask.end_time) {
          conflicts.push(academicTask);
        }
      }
    });
    
    return conflicts;
  };

  const getScheduleConflicts = (schedule: WorkSchedule) => {
    if (!schedule.work_days || !schedule.start_time || !schedule.end_time) return [];

    return academicTasks.filter((academicTask) => {
      if (!academicTask.dueDate) return false;
      const academicDate = new Date(academicTask.dueDate);
      const academicDay = academicDate.toLocaleDateString('en-US', { weekday: 'long' });
      const academicTime = academicDate.toTimeString().slice(0, 5);
      return schedule.work_days.includes(academicDay) && academicTime >= schedule.start_time && academicTime <= schedule.end_time;
    });
  };

  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      {/* Pull to refresh indicator - Top sliding bar with Card design */}
      {(isPulling || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 flex items-center justify-center bg-background/80 backdrop-blur-lg transition-all duration-300 ease-out z-50"
          style={{
            height: isRefreshing ? '140px' : `${Math.min(pullDistance + 40, 160)}px`
          }}
        >
          <div className="bg-background/70 backdrop-blur-xl rounded-lg shadow-2xl border border-border p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isRefreshing ? (isOnline ? 'Refreshing... Please wait' : 'Refreshing from cache') : pullDistance >= 80 ? 'Release to refresh' : 'Pull to refresh'}
            </p>
          </div>
        </div>
      )}

      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Work Schedule</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeTasks.length} active schedules · {completedTasks.length} completed
              </p>
            </div>
          </div>
          <TaskActions />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 pb-64" data-pull-to-refresh onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
        <div className="grid grid-cols-1 gap-4" style={{ minHeight: 'fit-content' }}>
          {/* Schedule Preview */}
          <div className="order-2 lg:order-1">
            <div className="rounded-lg bg-card border p-4">
              <h3 className="text-lg font-semibold mb-4">Schedule Overview</h3>
              {schedules.map((schedule) => {
                const conflicts = getScheduleConflicts(schedule);
                return (
                  <div key={schedule.id} className="mb-4 p-3 border rounded">
                    <h4 className="font-medium">{schedule.job_title?.trim() || "Work Schedule"}</h4>
                    {schedule.work_days && schedule.work_days.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Days: {displayDays(schedule.work_days)}
                      </p>
                    )}
                    {schedule.start_time && schedule.end_time && (
                      <p className="text-sm text-muted-foreground">
                        Time: {formatTime12Hour(schedule.start_time)} - {formatTime12Hour(schedule.end_time)}
                      </p>
                    )}
                    {schedule.work_type && (
                      <p className="text-sm text-muted-foreground">
                        Type: {schedule.work_type}
                      </p>
                    )}
                    {conflicts.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-600 font-medium">⚠️ Conflicts:</p>
                        {conflicts.map(conflict => (
                          <p key={conflict.id} className="text-sm text-red-600">
                            {conflict.title} ({new Date(conflict.dueDate).toLocaleDateString()})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task List */}
          <div className="order-1 lg:order-2">
            <div className="rounded-lg bg-card border">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <TaskList
                  tasks={workTasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useOutletContext } from "react-router";
import { TaskList } from "../components/TaskList";
import { TaskActions } from "../components/TaskActions";
import { Task } from "../types/task";
import { Flag, Loader2 } from "lucide-react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tasks: Task[];
}

export function PriorityPage() {
  const { selectedTaskId, setSelectedTaskId, searchQuery, tasks } = useOutletContext<OutletContext>();

  const handleRefresh = async () => {
    console.log('Pull to refresh: Starting refresh...');
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('Pull to refresh: Refresh complete!');
  };

  const { isPulling, pullDistance, isRefreshing, isOnline, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  const priorityTasks = tasks.filter((t) => t.priority === "high");
  
  const filteredTasks = priorityTasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Flag className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">High Priority</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeTasks.length} active · {completedTasks.length} completed
              </p>
            </div>
          </div>
          <TaskActions />
        </div>
      </div>

      <div className="flex-1 p-4 pb-64 overflow-auto" data-pull-to-refresh onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
        <div className="rounded-lg bg-card border" style={{ minHeight: 'fit-content' }}>
          <TaskList
            tasks={priorityTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
          />
        </div>
      </div>
    </div>
  );
}
import { useOutletContext } from "react-router";
import { TaskList } from "../components/TaskList";
import { TaskActions } from "../components/TaskActions";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Task } from "../types/task";
import { BookOpen, Loader2 } from "lucide-react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tasks: Task[];
  loading: boolean;
}

export function AcademicPage() {
  const { selectedTaskId, setSelectedTaskId, searchQuery, tasks, loading } = useOutletContext<OutletContext>();

  const handleRefresh = async () => {
    console.log('Pull to refresh: Starting refresh...');
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('Pull to refresh: Refresh complete!');
  };

  const { isPulling, pullDistance, isRefreshing, isOnline, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  const academicTasks = tasks.filter((t) => t.category === "academic");
  
  const filteredTasks = academicTasks.filter((task) =>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Academic</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeTasks.length} active · {completedTasks.length} completed
              </p>
            </div>
          </div>
          <TaskActions />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 pb-64" data-pull-to-refresh onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
        <div className="rounded-lg bg-card border" style={{ minHeight: 'fit-content' }}>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <TaskList
              tasks={academicTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
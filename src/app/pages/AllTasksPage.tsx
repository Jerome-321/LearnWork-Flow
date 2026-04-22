import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { TaskList } from "../components/TaskList";
import { TaskActions } from "../components/TaskActions";
import { WorkScheduleModal } from "../components/WorkScheduleModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { useWorkScheduleAPI } from "../hooks/useWorkScheduleAPI";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

import { Task } from "../types/task";

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tasks: Task[];
  showAddTask: boolean;
  setShowAddTask: (show: boolean) => void;
  loading: boolean;
  refreshFromLocalStorage: () => void;
}

export function AllTasksPage() {
  const { selectedTaskId, setSelectedTaskId, searchQuery, tasks, showAddTask, setShowAddTask, loading, refreshFromLocalStorage } = useOutletContext<OutletContext>();
  const { schedules } = useWorkScheduleAPI();
  const [showWorkScheduleModal, setShowWorkScheduleModal] = useState(false);

  // Check if user has tasks but no work schedule (only show once per session)
  useEffect(() => {
    const hasTasks = tasks.length > 0;
    const hasWorkSchedule = schedules.length > 0;
    const hasSeenModal = sessionStorage.getItem('hasSeenWorkScheduleModal');
    
    // Show modal only if: user has tasks, no work schedule, not loading, and hasn't seen it this session
    if (hasTasks && !hasWorkSchedule && !loading && !hasSeenModal) {
      setShowWorkScheduleModal(true);
      sessionStorage.setItem('hasSeenWorkScheduleModal', 'true');
    }
  }, [tasks.length, schedules.length, loading]);

  const handleRefresh = async () => {
    console.log('Pull to refresh: Starting refresh...');
    await new Promise(resolve => setTimeout(resolve, 800));
    refreshFromLocalStorage();
    console.log('Pull to refresh: Refresh complete!');
  };

  const { isPulling, pullDistance, isRefreshing, isOnline, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  const handleWorkScheduleClose = () => {
    setShowWorkScheduleModal(false);
  };
  
  return (
    <>
      {/* Work Schedule Modal with backdrop blur */}
      <WorkScheduleModal 
        isOpen={showWorkScheduleModal} 
        onClose={handleWorkScheduleClose}
      />

      <div className={`flex flex-col bg-white dark:bg-background relative transition-all duration-300 ${showWorkScheduleModal ? 'blur-sm' : ''}`} style={{ height: '100dvh' }}>

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

      <div className="border-b border-slate-200 bg-white dark:bg-background dark:border-slate-700">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div>
            <h1 className="text-2xl font-semibold">All Tasks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeTasks.length} active · {completedTasks.length} completed
            </p>
          </div>
          <TaskActions open={showAddTask} onOpenChange={setShowAddTask} />
        </div>
      </div>

      <Tabs defaultValue="active" className="flex-1 flex flex-col bg-white dark:bg-background" style={{ minHeight: 0 }}>
        <TabsList className="mx-4 mt-4 w-auto self-start">
          <TabsTrigger value="active">
            Active ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="flex-1 m-0 mt-4 overflow-auto" data-pull-to-refresh onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
          <div className="px-4 pb-64" style={{ minHeight: 'fit-content' }}>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <TaskList
                tasks={activeTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="flex-1 m-0 mt-4 overflow-auto" data-pull-to-refresh onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
          <div className="px-4 pb-64" style={{ minHeight: 'fit-content' }}>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <TaskList
                tasks={completedTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
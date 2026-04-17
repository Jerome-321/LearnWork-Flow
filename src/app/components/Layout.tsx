import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { TaskActions } from "./TaskActions";
import { VirtualPet } from "./VirtualPet";
import { OfflineIndicator } from "./OfflineIndicator";
import { useTaskAPI } from "../hooks/useTaskAPI";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const { tasks, loading, refreshFromLocalStorage } = useTaskAPI();

  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Ensure desktop gets sidebar open automatically while mobile stays off by default
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);
  
  // Find the selected task
  const selectedTask = selectedTaskId ? safeTasks.find(t => t.id === selectedTaskId) : null;

  // Show loading state while data is loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-foreground mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col bg-background lg:flex-row"
      style={{ minHeight: '100dvh' }}
    >
      <OfflineIndicator />
      
      <Sidebar 
        open={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onAddTask={() => setShowAddTask(true)}
      />

      <div className="flex flex-1 flex-col" style={{ minHeight: '100dvh' }}>
        <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <main 
          className="overflow-y-auto overflow-x-hidden p-3 sm:p-4 pb-32 lg:pb-4" 
          style={{ 
            flex: 1,
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
          }}
        >
          <div
            className={`flex flex-col w-full gap-4 transition-all duration-300 ${
              selectedTask ? "lg:grid lg:grid-cols-[1fr_minmax(320px,400px)]" : ""
            }`}
            style={{ minHeight: 'fit-content' }}
          >
            <div className="w-full" style={{ minHeight: 'fit-content' }}>
              <Outlet context={{ selectedTaskId, setSelectedTaskId, searchQuery, setSearchQuery, tasks: safeTasks, showAddTask, setShowAddTask, loading, refreshFromLocalStorage }} />
            </div>

            {selectedTask && (
              <div className="w-full lg:w-auto">
                <TaskActions
                  task={selectedTask}
                  onClose={() => setSelectedTaskId(null)}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="block">
        <VirtualPet />
      </div>
    </div>
  );
}
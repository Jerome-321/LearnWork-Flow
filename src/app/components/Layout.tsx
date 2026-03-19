import { useState } from "react";
import { Outlet } from "react-router";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { VirtualPet } from "./VirtualPet";
import { useTaskAPI } from "../hooks/useTaskAPI";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { tasks, loading } = useTaskAPI();
  
  // Find the selected task
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <main className="flex flex-1 overflow-hidden relative">
          {/* Task List Area */}
          <div className={`flex-1 overflow-auto transition-all duration-300 ${selectedTask ? "lg:mr-[400px]" : ""}`}>
            <Outlet context={{ selectedTaskId, setSelectedTaskId, searchQuery, setSearchQuery }} />
          </div>

          {/* Task Detail Panel */}
          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => setSelectedTaskId(null)}
            />
          )}
        </main>
      </div>

      {/* Virtual Pet Widget */}
      <VirtualPet />
    </div>
  );
}
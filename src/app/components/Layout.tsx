import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { TaskActions } from "./TaskActions";
import { VirtualPet } from "./VirtualPet";
import { useTaskAPI } from "../hooks/useTaskAPI";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { tasks, loading } = useTaskAPI();

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
    <div className="min-h-screen flex flex-col overflow-hidden bg-background lg:flex-row">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 flex-col min-h-screen overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <main className="flex-1 overflow-auto p-3 sm:p-4">
          <div
            className={`flex flex-col w-full h-full gap-4 transition-all duration-300 ${
              selectedTask ? "lg:grid lg:grid-cols-[1fr_minmax(320px,400px)]" : ""
            }`}
          >
            <div className="w-full overflow-auto">
              <Outlet context={{ selectedTaskId, setSelectedTaskId, searchQuery, setSearchQuery, tasks }} />
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

      <div className="lg:block hidden">
        <VirtualPet />
      </div>
    </div>
  );
}
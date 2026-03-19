import { useOutletContext } from "react-router";
import { TaskList } from "../components/TaskList";
import { TaskActions } from "../components/TaskActions";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { BookOpen } from "lucide-react";

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function AcademicPage() {
  const { selectedTaskId, setSelectedTaskId, searchQuery } = useOutletContext<OutletContext>();
  const { tasks } = useTaskAPI();

  const academicTasks = tasks.filter((t) => t.category === "academic");
  
  const filteredTasks = academicTasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  return (
    <div className="flex flex-col h-full bg-background">
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

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-lg bg-card border">
          <TaskList
            tasks={academicTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
          />
        </div>
      </div>
    </div>
  );
}
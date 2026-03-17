import { useOutletContext } from "react-router";
import { TaskList } from "../components/TaskList";
import { TaskActions } from "../components/TaskActions";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

export function AllTasksPage() {
  const { selectedTaskId, setSelectedTaskId } = useOutletContext<OutletContext>();
  const { tasks } = useTaskAPI();

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div>
            <h1 className="text-2xl font-semibold">All Tasks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeTasks.length} active · {completedTasks.length} completed
            </p>
          </div>
          <TaskActions />
        </div>
      </div>

      <Tabs defaultValue="active" className="flex-1 flex flex-col bg-background">
        <TabsList className="mx-4 mt-4 w-auto self-start">
          <TabsTrigger value="active">
            Active ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="flex-1 m-0 mt-4 overflow-auto">
          <div className="mx-4 mb-4 rounded-lg bg-card border">
            <TaskList
              tasks={activeTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </div>
        </TabsContent>

        <TabsContent value="completed" className="flex-1 m-0 mt-4 overflow-auto">
          <div className="mx-4 mb-4 rounded-lg bg-card border">
            <TaskList
              tasks={completedTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
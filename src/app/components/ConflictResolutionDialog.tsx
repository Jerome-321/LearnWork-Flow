import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Task } from "../types/task";

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localTask: Task;
  serverTask: Task;
  onResolve: (keepLocal: boolean) => void;
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  localTask,
  serverTask,
  onResolve,
}: ConflictResolutionDialogProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <AlertDialogTitle>Sync Conflict Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This task was modified both locally and on the server. Choose which version to keep.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          {/* Local Version */}
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-sm text-blue-900 mb-3">Your Local Changes</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600 font-medium">Title:</span>
                <p className="text-slate-900 mt-1">{localTask.title}</p>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Description:</span>
                <p className="text-slate-900 mt-1 line-clamp-3">{localTask.description || 'No description'}</p>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Status:</span>
                <p className="text-slate-900 mt-1">{localTask.completed ? 'Completed' : 'Active'}</p>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Priority:</span>
                <p className="text-slate-900 mt-1 capitalize">{localTask.priority}</p>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Due Date:</span>
                <p className="text-slate-900 mt-1">{localTask.dueDate ? formatDate(localTask.dueDate) : 'No due date'}</p>
              </div>
            </div>
          </div>

          {/* Server Version */}
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <h3 className="font-semibold text-sm text-green-900 mb-3">Server Version</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600 font-medium">Title:</span>
                <p className="text-slate-900 mt-1">{serverTask.title}</p>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Description:</span>
                <p className="text-slate-900 mt-1 line-clamp-3">{serverTask.description || 'No description'}</p>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Status:</span>
                <p className="text-slate-900 mt-1">{serverTask.completed ? 'Completed' : 'Active'}</p>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Priority:</span>
                <p className="text-slate-900 mt-1 capitalize">{serverTask.priority}</p>
              </div>
              <div>
                <span className="text-slate-600 font-medium">Due Date:</span>
                <p className="text-slate-900 mt-1">{serverTask.dueDate ? formatDate(serverTask.dueDate) : 'No due date'}</p>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => onResolve(false)} className="w-full sm:w-auto">
            Keep Server Version
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onResolve(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            Keep My Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

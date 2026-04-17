import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function OfflineIndicator() {
  const { isOfflineMode, pendingSyncCount, syncData } = useTaskAPI();

  if (!isOfflineMode && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 md:top-16">
      <Badge
        variant={isOfflineMode ? "destructive" : "secondary"}
        className="flex items-center gap-2 px-3 py-2 shadow-lg"
      >
        {isOfflineMode ? (
          <>
            <CloudOff className="h-4 w-4" />
            <span className="text-sm font-medium">Offline Mode</span>
          </>
        ) : (
          <>
            <Cloud className="h-4 w-4" />
            <span className="text-sm font-medium">Online</span>
          </>
        )}
        
        {pendingSyncCount > 0 && (
          <>
            <span className="text-xs opacity-75">•</span>
            <span className="text-xs">{pendingSyncCount} pending</span>
            {!isOfflineMode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1"
                onClick={() => syncData()}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </Badge>
    </div>
  );
}

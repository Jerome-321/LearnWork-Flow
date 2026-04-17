import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

interface SyncStatusIndicatorProps {
  isOffline: boolean;
  pendingSyncCount: number;
  onSync: () => Promise<void>;
}

export function SyncStatusIndicator({ isOffline, pendingSyncCount, onSync }: SyncStatusIndicatorProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isOffline && pendingSyncCount === 0 && syncStatus === 'syncing') {
      setSyncStatus('success');
      setLastSyncTime(new Date());
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [isOffline, pendingSyncCount, syncStatus]);

  const handleSync = async () => {
    if (isSyncing || isOffline) return;
    
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    try {
      await onSync();
      setSyncStatus('success');
      setLastSyncTime(new Date());
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (isOffline) return <WifiOff className="w-4 h-4" />;
    if (syncStatus === 'syncing') return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (syncStatus === 'success') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (syncStatus === 'error') return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (pendingSyncCount > 0) return <CloudOff className="w-4 h-4 text-amber-600" />;
    return <Wifi className="w-4 h-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (isOffline) return 'Offline';
    if (syncStatus === 'syncing') return 'Syncing...';
    if (syncStatus === 'success') return 'Synced';
    if (syncStatus === 'error') return 'Sync failed';
    if (pendingSyncCount > 0) return `${pendingSyncCount} pending`;
    return 'Online';
  };

  const getStatusColor = () => {
    if (isOffline) return 'text-red-600 bg-red-50';
    if (syncStatus === 'syncing') return 'text-blue-600 bg-blue-50';
    if (syncStatus === 'success') return 'text-green-600 bg-green-50';
    if (syncStatus === 'error') return 'text-red-600 bg-red-50';
    if (pendingSyncCount > 0) return 'text-amber-600 bg-amber-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing || isOffline}
        className={cn(
          "h-8 px-3 gap-2 text-xs font-medium rounded-full transition-all",
          getStatusColor()
        )}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Button>
      
      {lastSyncTime && syncStatus === 'success' && (
        <span className="text-xs text-slate-500">
          {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

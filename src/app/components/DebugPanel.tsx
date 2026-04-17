import { useAuth } from "../contexts/AuthContext";
import { projectId } from "/utils/supabase/info";
import { Button } from "./ui/button";
import { useState } from "react";

export function DebugPanel() {
  const { user, session, getAccessToken, signOut, refreshSession } = useAuth();
  const [healthStatus, setHealthStatus] = useState<string>("Not checked");
  const [syncStatus, setSyncStatus] = useState<string>("Not checked");
  const [refreshStatus, setRefreshStatus] = useState<string>("");

  // Only show debug panel if user is authenticated
  if (!user) {
    return null;
  }

  const testHealth = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-c3569cb3/health`;
      const response = await fetch(url);
      const data = await response.json();
      setHealthStatus(response.ok ? `✅ OK - ${JSON.stringify(data)}` : `❌ Failed - ${response.status}`);
    } catch (err: any) {
      setHealthStatus(`❌ Error - ${err.message}`);
    }
  };

  const testSync = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-c3569cb3/sync`;
      const token = getAccessToken();
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      setSyncStatus(response.ok ? `✅ OK - ${JSON.stringify(data).substring(0, 100)}...` : `❌ Failed - ${JSON.stringify(data)}`);
    } catch (err: any) {
      setSyncStatus(`❌ Error - ${err.message}`);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setRefreshStatus("Refreshing...");
      await refreshSession();
      setRefreshStatus("✅ Session refreshed! Reload page.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setRefreshStatus(`❌ ${err.message}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg max-w-md text-xs z-50">
      <h3 className="font-bold mb-2">🔧 Debug Panel</h3>
      
      <div className="space-y-2">
        <div>
          <strong>User:</strong> {user ? `✅ ${user.email}` : "❌ Not logged in"}
        </div>
        
        <div>
          <strong>Session:</strong> {session ? "✅ Active" : "❌ No session"}
        </div>
        
        <div>
          <strong>Token:</strong> {getAccessToken() ? `✅ ${getAccessToken()?.substring(0, 20)}...` : "❌ No token"}
        </div>
        
        <div className="space-y-1 pt-2">
          <Button size="sm" onClick={testHealth} className="w-full">
            Test Health Endpoint
          </Button>
          <div className="text-xs break-words">{healthStatus}</div>
        </div>
        
        <div className="space-y-1">
          <Button size="sm" onClick={testSync} className="w-full">
            Test Sync Endpoint
          </Button>
          <div className="text-xs break-words">{syncStatus}</div>
        </div>

        <div className="space-y-1 pt-2 border-t">
          <Button size="sm" onClick={handleRefreshSession} variant="secondary" className="w-full">
            🔄 Refresh Session
          </Button>
          <div className="text-xs break-words">{refreshStatus}</div>
        </div>

        <div className="space-y-1">
          <Button size="sm" onClick={handleLogout} variant="destructive" className="w-full">
            🚪 Logout & Reload
          </Button>
        </div>
      </div>
    </div>
  );
}
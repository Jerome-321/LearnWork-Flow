import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface DeploymentHelpProps {
  onClose?: () => void;
}

export function DeploymentHelp({ onClose }: DeploymentHelpProps) {
  const copyDeployCommand = () => {
    navigator.clipboard.writeText("supabase functions deploy make-server-c3569cb3");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">📱</div>
            <div>
              <h2 className="text-2xl font-bold">Working in Offline Mode</h2>
              <p className="text-muted-foreground">
                Your tasks are saved in your browser. Deploy to enable cloud sync!
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm">
              ✅ <strong>Good news:</strong> The app works perfectly! All features are available offline.
            </p>
            <p className="text-sm mt-2">
              💡 <strong>Optional:</strong> Deploy the Edge Function to sync your data across devices and enable cloud backup.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">📋 Deployment Options:</h3>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Option 1: Supabase CLI (Recommended)</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Install Supabase CLI if you haven't already</li>
                  <li>Navigate to your project directory</li>
                  <li>Run the deployment command:</li>
                </ol>
                <div className="mt-3 flex gap-2">
                  <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm font-mono">
                    supabase functions deploy make-server-c3569cb3
                  </code>
                  <Button size="sm" onClick={copyDeployCommand}>
                    Copy
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Option 2: Supabase Dashboard</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to Edge Functions</li>
                  <li>Click "Deploy new function"</li>
                  <li>Upload the files from <code>/supabase/functions/server/</code></li>
                  <li>Set function name to: <code>make-server-c3569cb3</code></li>
                </ol>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📁 Files to Deploy:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground font-mono">
                <li>✅ /supabase/functions/server/index.tsx</li>
                <li>✅ /supabase/functions/server/kv_store.tsx</li>
                <li>✅ /supabase/functions/server/config.toml</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2">✅ After Deployment:</h4>
              <p className="text-sm text-muted-foreground">
                Once deployed, refresh this page and the app will connect automatically!
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              🔄 Refresh Page
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("https://supabase.com/docs/guides/functions/deploy", "_blank")}
            >
              📚 Deployment Docs
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
import { useEffect } from "react";
import { useLoading } from "../contexts/LoadingContext";
import { Loader2 } from "lucide-react"; // ✅ shadcn uses lucide icons
import { Card, CardContent } from "./ui/card"; // ✅ shadcn Card component

export default function LoadingOverlay() {
  const { loading, setLoading } = useLoading();

  useEffect(() => {
    const stored = localStorage.getItem("global-loading");

    if (stored) {
      const { startTime } = JSON.parse(stored);

      const MIN_DURATION = 800; // 🔥 adjust delay

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_DURATION - elapsed);

      setLoading(true);

      setTimeout(() => {
        localStorage.removeItem("global-loading");
        setLoading(false);
      }, remaining);
    }
  }, [setLoading]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-sm">
      
      {/* ✅ shadcn Card */}
      <Card className="shadow-xl border-muted">
        <CardContent className="flex flex-col items-center gap-4 p-8">

          {/* ✅ Spinner */}
          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          {/* ✅ Message */}
          <p className="text-sm text-muted-foreground">
            Processing... Please wait
          </p>

        </CardContent>
      </Card>

    </div>
  );
}
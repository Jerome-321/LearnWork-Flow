import { useState, useEffect } from "react";
import { useLoading } from "../contexts/LoadingContext";
import { Loader2 } from "lucide-react";

export default function LoadingOverlay() {
  const { loading, setLoading } = useLoading();
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("global-loading");

    if (stored) {
      const { startTime } = JSON.parse(stored);

      const MIN_DURATION = 800;
      const FADE_OUT_DELAY = 300;
      const FADE_OUT_DURATION = 600;

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_DURATION - elapsed);

      setLoading(true);
      setIsFading(false);

      setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          localStorage.removeItem("global-loading");
          setLoading(false);
        }, FADE_OUT_DURATION);
      }, remaining + FADE_OUT_DELAY);
    }
  }, [setLoading]);

  if (!loading) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-700 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
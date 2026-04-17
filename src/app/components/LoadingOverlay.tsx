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

      const MIN_DURATION = 800; // 🔥 adjust delay
      const FADE_OUT_DELAY = 300; // ✨ delay before fade starts
      const FADE_OUT_DURATION = 400; // ✨ fade animation duration

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_DURATION - elapsed);

      setLoading(true);
      setIsFading(false);

      // Start fade-out after delay
      setTimeout(() => {
        setIsFading(true);
        
        // Remove loading after fade completes
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-sm transition-opacity duration-400 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      
      {/* Blurred glass card */}
      <div className="bg-background/60 backdrop-blur-md rounded-lg shadow-xl border border-border p-8 flex flex-col items-center gap-4">
        {/* Spinner */}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        {/* Message */}
        <p className="text-sm text-muted-foreground">
          Processing... Please wait
        </p>
      </div>

    </div>
  );
}
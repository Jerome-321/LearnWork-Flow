import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ActionLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  delayBeforeFade?: number; // Delay in ms after loading completes before fading
}

export function ActionLoadingOverlay({ 
  isLoading, 
  message = "Processing...",
  delayBeforeFade = 500 
}: ActionLoadingOverlayProps) {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Action started - show loading immediately
      setShow(true);
      setFadeOut(false);
      setInternalLoading(true);
    } else if (internalLoading) {
      // Loading finished - keep showing for a bit to let UI update
      const delayTimer = setTimeout(() => {
        // Start fade out after delay
        setFadeOut(true);
        const fadeTimer = setTimeout(() => {
          setShow(false);
          setFadeOut(false);
          setInternalLoading(false);
        }, 400); // Fade duration
        return () => clearTimeout(fadeTimer);
      }, delayBeforeFade);
      return () => clearTimeout(delayTimer);
    }
  }, [isLoading, internalLoading, delayBeforeFade]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="bg-background/60 backdrop-blur-md rounded-lg shadow-xl border border-border p-8 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

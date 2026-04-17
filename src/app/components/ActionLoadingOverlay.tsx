import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ActionLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function ActionLoadingOverlay({ isLoading, message = "Processing..." }: ActionLoadingOverlayProps) {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
      setFadeOut(false);
    } else if (show) {
      setFadeOut(true);
      const timer = setTimeout(() => {
        setShow(false);
        setFadeOut(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, show]);

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

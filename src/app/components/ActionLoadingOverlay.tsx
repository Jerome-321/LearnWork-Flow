import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ActionLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  delayBeforeFade?: number;
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
      setShow(true);
      setFadeOut(false);
      setInternalLoading(true);
    } else if (internalLoading) {
      const delayTimer = setTimeout(() => {
        setFadeOut(true);
        const fadeTimer = setTimeout(() => {
          setShow(false);
          setFadeOut(false);
          setInternalLoading(false);
        }, 400);
        return () => clearTimeout(fadeTimer);
      }, delayBeforeFade);
      return () => clearTimeout(delayTimer);
    }
  }, [isLoading, internalLoading, delayBeforeFade]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

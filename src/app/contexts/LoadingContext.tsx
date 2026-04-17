import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";

type LoadingContextType = {
  loading: boolean;
  setLoading: (value: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoadingState] = useState(false);
  const loadingCount = useRef(0);
  const hideTimer = useRef<number | null>(null);

  const setLoading = (value: boolean) => {
    if (value) {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      loadingCount.current += 1;
      if (loadingCount.current === 1) {
        setLoadingState(true);
      }
    } else {
      loadingCount.current = Math.max(0, loadingCount.current - 1);
      if (loadingCount.current === 0) {
        // Keep loader visible for at least 200ms to avoid quick flashes
        hideTimer.current = window.setTimeout(() => {
          setLoadingState(false);
          hideTimer.current = null;
        }, 200);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) throw new Error("useLoading must be used inside LoadingProvider");
  return context;
};
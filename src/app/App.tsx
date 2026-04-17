import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingProvider } from "./contexts/LoadingContext";
import LoadingOverlay from "./components/LoadingOverlay";
import { ActionLoadingOverlay } from "./components/ActionLoadingOverlay";
import { useTaskAPI } from "./hooks/useTaskAPI";

function AppContent() {
  const { actionLoading } = useTaskAPI();
  
  return (
    <>
      <ActionLoadingOverlay isLoading={actionLoading} message="Processing..." />
      <LoadingOverlay />
      <AuthGuard>
        <RouterProvider router={router} />
      </AuthGuard>
      <Toaster />
    </>
  );
}

function App() {
  console.log("App rendering...");
  
  try {
    return (
      <ErrorBoundary>
        <LoadingProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </LoadingProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App render error:', error);
    return <div>Error loading app</div>;
  }
}

export default App;
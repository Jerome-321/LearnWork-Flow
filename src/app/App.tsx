import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ✅ ADD THESE
import { LoadingProvider } from "./contexts/LoadingContext";
import LoadingOverlay from "./components/LoadingOverlay";

// ❌ REMOVE THIS
// import "./utils/loadingOverlay";

function App() {
  console.log("App rendering...");
  
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>

          {/* ✅ GLOBAL LOADING WRAPPER */}
          <LoadingProvider>
            <LoadingOverlay />

            <AuthGuard>
              <RouterProvider router={router} />
            </AuthGuard>

          </LoadingProvider>

          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
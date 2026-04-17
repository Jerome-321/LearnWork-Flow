import { createRoot } from "react-dom/client";
import { Toaster } from "./app/components/ui/sonner";
import { ThemeProvider } from "./app/providers/ThemeProvider";
import { LoadingProvider } from "./app/contexts/LoadingContext";
import { AuthProvider } from "./app/contexts/AuthContext";
import LoadingOverlay from "./app/components/LoadingOverlay";
import "./styles/index.css";

console.log("=== APP STARTING ===");

function TestApp() {
  console.log("TestApp rendering");
  return (
    <div style={{ padding: "20px" }}>
      <h1>Testing Components...</h1>
      <p>Step 1: Basic rendering ✓</p>
      <p>Step 2: Styles ✓</p>
      <p>Step 3: Theme & Loading providers ✓</p>
      <p>Step 4: Auth provider (with push notifications)...</p>
    </div>
  );
}

try {
  const root = document.getElementById("root");
  if (!root) throw new Error("Root not found");
  
  createRoot(root).render(
    <LoadingProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <TestApp />
          <LoadingOverlay />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </LoadingProvider>
  );
  console.log("=== RENDER SUCCESS ===");
} catch (error) {
  console.error("=== RENDER FAILED ===", error);
  document.body.innerHTML = `<div style="padding:20px;color:red;"><h1>Error</h1><pre>${error}</pre></div>`;
}

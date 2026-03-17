import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";

export function MobileLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

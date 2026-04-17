import { Outlet } from "react-router";
import { GmailStyleNav } from "./GmailStyleNav";

export function DesktopLayout() {
  return (
    <div className="h-screen">
      <GmailStyleNav />
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full flex">
          <div className="w-64"></div>
          <div className="flex-1 flex flex-col">
            <div className="h-[120px]"></div>
            <div className="flex-1 pointer-events-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Home, BookOpen, Briefcase, User, Calendar, BarChart3, Clock, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

const navItems = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "academic", label: "Academic", icon: BookOpen, path: "/academic" },
  { id: "work", label: "Work", icon: Briefcase, path: "/work" },
  { id: "personal", label: "Personal", icon: User, path: "/personal" },
  { id: "work-schedule", label: "Schedule", icon: Clock, path: "/work-schedule" },
  { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
  { id: "progress", label: "Progress", icon: BarChart3, path: "/progress" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom overflow-x-auto scrollbar-hide">
      <div className="flex items-center justify-start min-w-max px-2 py-2 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-xl transition-all min-w-[50px] flex-shrink-0 ${
                isActive
                  ? "text-slate-950 bg-slate-100"
                  : "text-slate-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

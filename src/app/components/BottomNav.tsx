import { Home, Inbox, Scan, Users, MoreHorizontal } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "inbox", label: "Inbox", icon: Inbox, path: "/inbox" },
  { id: "scan", label: "Scan", icon: Scan, path: "/scan" },
  { id: "customer", label: "Customer", icon: Users, path: "/customer" },
  { id: "more", label: "More", icon: MoreHorizontal, path: "/more" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "fill-blue-600" : ""}`} />
              <span className={`text-xs font-medium ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

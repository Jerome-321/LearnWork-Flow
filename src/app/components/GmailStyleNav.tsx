import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router";
import { 
  Home, 
  Inbox, 
  Users, 
  BarChart3, 
  Settings, 
  Star,
  Archive,
  Trash2,
  Menu,
  Search,
  Bell,
  User
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  badge?: number;
}

const primaryNavItems: NavItem[] = [
  { id: "inbox", label: "Inbox", icon: Inbox, path: "/inbox", badge: 8 },
  { id: "starred", label: "Starred", icon: Star, path: "/starred" },
  { id: "archived", label: "Archived", icon: Archive, path: "/archived" },
];

const secondaryNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "customers", label: "Customers", icon: Users, path: "/customers" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export function GmailStyleNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm`}
      >
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          )}
        </div>

        {/* Compose Button */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3 px-6 font-medium shadow-md transition-colors flex items-center justify-center gap-2">
              <span>+ Compose</span>
            </button>
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-r-full transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="bg-gray-700 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="py-3">
            <div className="border-t border-gray-300"></div>
          </div>

          {/* Secondary Navigation */}
          <div className="space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-r-full transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-3xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-12 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-8">
            <button className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
              Primary
            </button>
            <button className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium text-sm">
              Social
            </button>
            <button className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium text-sm">
              Promotions
            </button>
          </div>
        </div>

        {/* Main Content - Outlet for routes */}
        <main className="flex-1 overflow-hidden bg-gray-50">
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
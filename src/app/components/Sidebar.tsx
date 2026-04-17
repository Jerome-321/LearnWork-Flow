import {
  Inbox,
  BookOpen,
  Briefcase,
  User,
  Plus,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  onAddTask?: () => void;
}

export function Sidebar({ open, onToggle, onAddTask }: SidebarProps) {
  const { tasks } = useTaskAPI();
  const navigate = useNavigate();
  const location = useLocation();

  const getCategoryCount = (category: string) => {
    if (category === "all") return tasks.length;
    if (category === "priority")
      return tasks.filter((t) => t.priority === "high" && !t.completed).length;
    return tasks.filter((t) => t.category === category && !t.completed).length;
  };

  // Bottom nav items for mobile
  const bottomNavItems = [
    { path: "/", icon: Inbox, label: "Home" },
    { path: "/academic", icon: BookOpen, label: "Academic" },
    { path: "/work", icon: Briefcase, label: "Work" },
    { path: "/personal", icon: User, label: "Personal" },
    { path: "/work-schedule", icon: Briefcase, label: "Schedule" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/progress", icon: BarChart3, label: "Progress" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  // Desktop sidebar items
  const navItems = [
    { path: "/", icon: Inbox, label: "All Tasks", count: getCategoryCount("all") },
    {
      path: "/academic",
      icon: BookOpen,
      label: "Academic",
      count: getCategoryCount("academic"),
    },
    {
      path: "/work",
      icon: Briefcase,
      label: "Work",
      count: getCategoryCount("work"),
    },
    {
      path: "/personal",
      icon: User,
      label: "Personal",
      count: getCategoryCount("personal"),
    },
  ];

  const secondaryItems = [
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/work-schedule", icon: Briefcase, label: "Work Schedule" },
    { path: "/progress", icon: BarChart3, label: "Progress" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Floating Bottom Nav */}
      <nav className="fixed bottom-6 left-4 right-4 z-50 lg:hidden">
        <div className="relative">
          {/* Scrollable Navigation Bar with circular cutout */}
          <div className="relative bg-white dark:bg-gray-900 border rounded-full shadow-2xl pointer-events-auto">
            {/* Circular cutout in the middle */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 w-16 h-16 -mt-8 rounded-full bg-transparent z-20 pointer-events-none"
              style={{
                boxShadow: '0 0 0 1000px rgba(255, 255, 255, 1)',
                clipPath: 'circle(32px at center)'
              }}
            />
            
            <div 
              className="flex items-center h-16 overflow-x-scroll scrollbar-hide snap-x snap-mandatory scroll-smooth"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* Snap point 1: Home | Academic | (+) | Work | Personal */}
              <div className="flex items-center justify-center min-w-full snap-center shrink-0">
                <div className="flex items-center gap-1">
                  {bottomNavItems.slice(0, 2).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                  {/* Space for + button */}
                  <div className="w-16 h-full shrink-0" />
                  {bottomNavItems.slice(2, 4).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Snap point 2: Academic | Work | (+) | Personal | Schedule */}
              <div className="flex items-center justify-center min-w-full snap-center shrink-0">
                <div className="flex items-center gap-1">
                  {bottomNavItems.slice(1, 3).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                  {/* Space for + button */}
                  <div className="w-16 h-full shrink-0" />
                  {bottomNavItems.slice(3, 5).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Snap point 3: Work | Personal | (+) | Schedule | Calendar */}
              <div className="flex items-center justify-center min-w-full snap-center shrink-0">
                <div className="flex items-center gap-1">
                  {bottomNavItems.slice(2, 4).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                  {/* Space for + button */}
                  <div className="w-16 h-full shrink-0" />
                  {bottomNavItems.slice(4, 6).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Snap point 4: Personal | Schedule | (+) | Calendar | Progress */}
              <div className="flex items-center justify-center min-w-full snap-center shrink-0">
                <div className="flex items-center gap-1">
                  {bottomNavItems.slice(3, 5).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                  {/* Space for + button */}
                  <div className="w-16 h-full shrink-0" />
                  {bottomNavItems.slice(5, 7).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Snap point 5: Schedule | Calendar | (+) | Progress | Settings */}
              <div className="flex items-center justify-center min-w-full snap-center shrink-0">
                <div className="flex items-center gap-1">
                  {bottomNavItems.slice(4, 6).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                  {/* Space for + button */}
                  <div className="w-16 h-full shrink-0" />
                  {bottomNavItems.slice(6, 8).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex flex-col items-center justify-center w-[70px] h-full gap-1 transition-all duration-300 touch-manipulation",
                          active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <Icon className="h-5 w-5 pointer-events-none" />
                        <span className="text-xs font-medium pointer-events-none whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Fixed Center Add Button */}
          <button
            onClick={onAddTask}
            className="absolute left-1/2 top-0 -translate-x-1/2 flex items-center justify-center w-16 h-16 -mt-6 bg-black dark:bg-white rounded-full shadow-lg hover:scale-105 transition-transform touch-manipulation pointer-events-auto z-30"
          >
            <Plus className="h-7 w-7 text-white dark:text-black pointer-events-none" />
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 z-50 h-screen transform border-r bg-background transition-all duration-300",
          "lg:static lg:z-auto lg:h-auto lg:top-0",
          open ? "lg:translate-x-0 lg:w-64" : "lg:translate-x-0 lg:w-16"
        )}
      >
        <ScrollArea className="h-[calc(100vh-88px)] lg:h-screen">
          <div className="flex flex-col h-full p-3 space-y-3">
            {/* Collapse Button (Desktop) */}
            <div className="hidden lg:flex justify-end -mt-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-7 w-7"
                title={open ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform",
                    !open && "rotate-180"
                  )}
                />
              </Button>
            </div>

            {/* Main Navigation */}
            <div className="space-y-1">
              {open && (
                <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Tasks
                </h2>
              )}
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Button
                    key={item.path}
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full h-9",
                      open ? "justify-start gap-3 px-3" : "justify-center px-0",
                      active && "bg-secondary font-medium"
                    )}
                    onClick={() => {
                      console.log("Navigating to:", item.path);
                      navigate(item.path);
                      if (window.innerWidth < 1024) onToggle();
                    }}
                    title={!open ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {open && (
                      <>
                        <span className="flex-1 text-left text-sm">{item.label}</span>
                        {item.count > 0 && (
                          <Badge
                            variant={active ? "default" : "secondary"}
                            className="ml-auto h-5 px-1.5 text-xs"
                          >
                            {item.count}
                          </Badge>
                        )}
                      </>
                    )}
                    {!open && item.count > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </Button>
                );
              })}
            </div>

            <Separator />

            {/* Secondary Navigation */}
            <div className="space-y-1">
              {open && (
                <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Overview
                </h2>
              )}
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Button
                    key={item.path}
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full h-9",
                      open ? "justify-start gap-3 px-3" : "justify-center px-0",
                      active && "bg-secondary font-medium"
                    )}
                    onClick={() => {
                      navigate(item.path);
                      if (window.innerWidth < 1024) onToggle();
                    }}
                    title={!open ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {open && <span className="text-sm">{item.label}</span>}
                  </Button>
                );
              })}
            </div>

            {/* Bottom Spacer */}
            <div className="flex-1" />

            {/* Quick Stats Card - Only show when expanded */}
            {open && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold">Today's Progress</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {tasks.filter((t) => t.completed).length}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {tasks.length}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-black dark:bg-white rounded-full transition-all duration-500"
                    style={{
                      width: `${tasks.length > 0 ? (tasks.filter((t) => t.completed).length / tasks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {tasks.length > 0 
                    ? `${Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)}% complete`
                    : "No tasks yet"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
import {
  Inbox,
  BookOpen,
  Briefcase,
  User,
  Flag,
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
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const { tasks } = useTaskAPI();
  const navigate = useNavigate();
  const location = useLocation();

  const getCategoryCount = (category: string) => {
    if (category === "all") return tasks.length;
    if (category === "priority")
      return tasks.filter((t) => t.priority === "high" && !t.completed).length;
    return tasks.filter((t) => t.category === category && !t.completed).length;
  };

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
    {
      path: "/priority",
      icon: Flag,
      label: "High Priority",
      count: getCategoryCount("priority"),
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
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen transform border-r bg-background transition-all duration-300",
          "lg:static lg:z-auto lg:h-auto",
          // Mobile behavior
          open ? "translate-x-0 w-64" : "-translate-x-full w-64",
          // Desktop behavior - mini sidebar when closed, full when open
          open ? "lg:translate-x-0 lg:w-64" : "lg:translate-x-0 lg:w-16"
        )}
      >
        <div className="h-14 border-b lg:hidden" /> {/* TopNav spacer on mobile only */}
        <ScrollArea className="h-[calc(100vh-3.5rem)] lg:h-screen">
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
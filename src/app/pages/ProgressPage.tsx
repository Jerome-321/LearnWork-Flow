import { useState } from "react";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { PetTab } from "../components/PetTab";
import { ProgressTab } from "../components/ProgressTab";
import { ProgressProvider } from "../contexts/ProgressContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3 as BarChartIcon,
  Trophy,
  Target,
  Flame,
  Sparkles,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import { Badge } from "../components/ui/badge";

// Google-style color palette
const COLORS = {
  primary: {
    blue: "#2563eb",    // Primary blue
    lightBlue: "#3b82f6", // Light blue
    lighter: "#dbeafe",  // Very light blue
    pale: "#f0f9ff",     // Pale blue background
  },
  secondary: {
    gray: "#9ca3af",     // Gray
    lightGray: "#e5e7eb", // Light gray
    lighter: "#f3f4f6",  // Lighter gray
  },
  accent: {
    teal: "#14b8a6",     // Accent teal
    green: "#10b981",    // Green for positive
    amber: "#f59e0b",    // Amber for warning
  },
};

// Custom tooltip for better display
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-xs font-medium"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom bar shape for rounded corners
const RoundedBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  const radius = 6;

  if (width < 1 || height < 1) {
    return null;
  }

  return (
    <g>
      <defs>
        <linearGradient id={`gradient-${fill}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={1} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.8} />
        </linearGradient>
      </defs>
      <path
        d={`
          M ${x},${y + radius}
          L ${x},${y + height - radius}
          Q ${x},${y + height} ${x + radius},${y + height}
          L ${x + width - radius},${y + height}
          Q ${x + width},${y + height} ${x + width},${y + height - radius}
          L ${x + width},${y + radius}
          Q ${x + width},${y} ${x + width - radius},${y}
          L ${x + radius},${y}
          Q ${x},${y} ${x},${y + radius}
        `}
        fill={`url(#gradient-${fill})`}
      />
    </g>
  );
};

export function ProgressPage() {
  const { tasks, progress } = useTaskAPI();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "progress">("leaderboard");

  const handleRefresh = async () => {
    console.log('Pull to refresh: Starting refresh...');
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('Pull to refresh: Refresh complete!');
  };

  const { isPulling, pullDistance, isRefreshing, isOnline, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  if (!progress) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading progress...</p>
      </div>
    );
  }

  return (
    <ProgressProvider>
      <div
        className="flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
        style={{ height: '100dvh' }}
      >
        {/* Pull to refresh indicator - Top sliding bar with Card design */}
        {(isPulling || isRefreshing) && (
          <div
            className="fixed top-0 left-0 right-0 flex items-center justify-center bg-background/80 backdrop-blur-lg transition-all duration-300 ease-out z-50"
            style={{
              height: isRefreshing ? '140px' : `${Math.min(pullDistance + 40, 160)}px`
            }}
          >
            <div className="bg-background/70 backdrop-blur-xl rounded-lg shadow-2xl border border-border p-8 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isRefreshing ? (isOnline ? 'Refreshing... Please wait' : 'Refreshing from cache') : pullDistance >= 80 ? 'Release to refresh' : 'Pull to refresh'}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
          <div className="p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`pb-3 px-3 font-medium text-sm transition-colors ${
                  activeTab === "leaderboard"
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Leaderboards
              </button>
              <button
                onClick={() => setActiveTab("progress")}
                className={`pb-3 px-3 font-medium text-sm transition-colors ${
                  activeTab === "progress"
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Progress
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div
          className="overflow-y-auto overflow-x-hidden pb-64"
          data-pull-to-refresh
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            flex: 1,
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
          } as React.CSSProperties}
        >
          {activeTab === "leaderboard" && <PetTab />}
          {activeTab === "progress" && <ProgressTab />}
        </div>
      </div>
    </ProgressProvider>
  );
}
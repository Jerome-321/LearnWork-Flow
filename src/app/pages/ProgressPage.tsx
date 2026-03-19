import { useState } from "react";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { PetTab } from "../components/PetTab";
import { ProgressTab } from "../components/ProgressTab";
import { ProgressProvider } from "../contexts/ProgressContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
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

  if (!progress) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading progress...</p>
      </div>
    );
  }

  return (
    <ProgressProvider>
      <div className="flex flex-col h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
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
        <div className="flex-1 overflow-auto">
          {activeTab === "leaderboard" && <PetTab />}
          {activeTab === "progress" && <ProgressTab />}
        </div>
      </div>
    </ProgressProvider>
  );
}
import { useTaskAPI } from "../hooks/useTaskAPI";
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

  if (!progress) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading progress...</p>
      </div>
    );
  }

  const categoryData = [
    {
      name: "Academic",
      completed: tasks.filter((t) => t.category === "academic" && t.completed).length,
      total: tasks.filter((t) => t.category === "academic").length,
    },
    {
      name: "Work",
      completed: tasks.filter((t) => t.category === "work" && t.completed).length,
      total: tasks.filter((t) => t.category === "work").length,
    },
    {
      name: "Personal",
      completed: tasks.filter((t) => t.category === "personal" && t.completed).length,
      total: tasks.filter((t) => t.category === "personal").length,
    },
  ];

  const pieData = [
    { name: "Academic", value: tasks.filter((t) => t.category === "academic").length, color: COLORS.primary.blue },
    { name: "Work", value: tasks.filter((t) => t.category === "work").length, color: COLORS.primary.lightBlue },
    { name: "Personal", value: tasks.filter((t) => t.category === "personal").length, color: COLORS.accent.teal },
  ];

  // Get current day index
  const today = new Date().getDay();
  const currentDayIndex = today === 0 ? 6 : today - 1; // Adjust for Mon-Sun

  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const isToday = i === currentDayIndex;
    const completed = Math.floor(Math.random() * 5); // Mock data for demo
    return {
      day: dayName,
      completed,
      isToday,
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      fill: isToday ? "url(#colorActiveGradient)" : "url(#colorInactiveGradient)",
    };
  });

  return (
    <div className="flex flex-col h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <BarChartIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Progress Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Track your productivity and achievements
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Points
                </CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progress.totalPoints}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Level {progress.petLevel} · {progress.petStage}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Streak
                </CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
                  <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progress.currentStreak} days
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Longest: {progress.longestStreak} days
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tasks Completed
                </CardTitle>
                <div className="p-2 bg-amber-100 dark:bg-amber-950 rounded-lg">
                  <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progress.tasksCompleted}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {tasks.filter((t) => !t.completed).length} remaining
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md hover:border-green-200 dark:hover:border-green-900 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completion Rate
                </CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.length > 0
                    ? Math.round((progress.tasksCompleted / tasks.length) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  All time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Goals */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Target className="h-5 w-5 text-blue-500" />
                Current Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {goal.title}
                      </span>
                      {goal.completed && (
                        <Badge
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Completed
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {goal.current} / {goal.target}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${(goal.current / goal.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Category Progress */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  Tasks by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={categoryData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.primary.blue} stopOpacity={1} />
                        <stop offset="100%" stopColor={COLORS.primary.lightBlue} stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.secondary.lightGray} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={COLORS.secondary.lightGray} stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" stroke={COLORS.secondary.lighter} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke={COLORS.secondary.gray}
                      style={{ fontSize: "12px" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={COLORS.secondary.gray}
                      style={{ fontSize: "12px" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: COLORS.primary.pale, radius: 8 }}
                    />
                    <Bar
                      dataKey="completed"
                      fill="url(#colorCompleted)"
                      name="Completed"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="total"
                      fill="url(#colorTotal)"
                      name="Total"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      innerRadius={45}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            
          </div>
        </div>
      </div>
    </div>
  );
}
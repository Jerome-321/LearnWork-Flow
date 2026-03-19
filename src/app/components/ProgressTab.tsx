import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { useProgress } from "../contexts/ProgressContext";
import { useTaskAPI } from "../hooks/useTaskAPI";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Target, Flame, Award } from "lucide-react";

// Color palette - Minimalist grayscale
const COLORS = {
  primary: {
    dark: "#1f2937",
    light: "#6b7280",
  },
  secondary: {
    bg: "#f3f4f6",
  },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {payload[0]?.name}: {payload[0]?.value}
      </p>
    </div>
  );
};

export function ProgressTab() {
  const { tasks } = useTaskAPI();
  const { progress, loading, refreshProgress } = useProgress();

  if (!progress) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading progress data...</p>
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
    {
      name: "Academic",
      value: tasks.filter((t) => t.category === "academic").length,
      color: COLORS.primary.dark,
    },
    {
      name: "Work",
      value: tasks.filter((t) => t.category === "work").length,
      color: COLORS.primary.light,
    },
    {
      name: "Personal",
      value: tasks.filter((t) => t.category === "personal").length,
      color: "#9ca3af",
    },
  ];

  const barChartData = categoryData.map((cat) => ({
    name: cat.name,
    completed: cat.completed,
    remaining: cat.total - cat.completed,
  }));

  const overallCompletion = tasks.length > 0 ? Math.round((progress.tasksCompleted / tasks.length) * 100) : 0;

  const handleManualSync = async () => {
    await refreshProgress();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Points */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {progress.totalPoints}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Level {progress.petLevel}
            </p>
          </CardContent>
        </Card>

        {/* Tasks Completed */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {progress.tasksCompleted}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              of {tasks.length} total
            </p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {progress.currentStreak ?? 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              days
            </p>
          </CardContent>
        </Card>

        {/* Longest Streak */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Longest Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {progress.longestStreak ?? 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Completion */}
      <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Overall Completion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Progress</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {overallCompletion}%
              </span>
            </div>
            <Progress value={overallCompletion} className="h-3" />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {progress.tasksCompleted} of {tasks.length} tasks completed
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Tasks by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" fill={COLORS.primary.dark} radius={[8, 8, 0, 0]} />
                <Bar dataKey="remaining" fill={COLORS.secondary.bg} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Task Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData.filter((p) => p.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
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
      </div>

      {/* Category Details */}
      <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Category Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryData.map((category) => {
            const percentage = category.total > 0 ? Math.round((category.completed / category.total) * 100) : 0;
            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.completed} / {category.total}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {percentage}% completed
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Sync Button */}
      <div className="flex justify-center">
        <button
          onClick={handleManualSync}
          disabled={loading}
          className="px-6 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? "Syncing..." : "Manual Sync"}
        </button>
      </div>
    </div>
  );
}

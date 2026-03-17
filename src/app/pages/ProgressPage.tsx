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
    { name: "Academic", value: tasks.filter((t) => t.category === "academic").length, color: "#000000" },
    { name: "Work", value: tasks.filter((t) => t.category === "work").length, color: "#737373" },
    { name: "Personal", value: tasks.filter((t) => t.category === "personal").length, color: "#a3a3a3" },
  ];

  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const completed = Math.floor(Math.random() * 5); // Mock data for demo
    return { day: dayName, completed };
  });

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      <div className="border-b bg-card">
        <div className="p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black dark:bg-white">
              <BarChartIcon className="h-5 w-5 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Progress Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Sparkles className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progress.totalPoints}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Level {progress.petLevel} · {progress.petStage}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Flame className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progress.currentStreak} days</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Longest: {progress.longestStreak} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                <Trophy className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progress.tasksCompleted}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tasks.filter((t) => !t.completed).length} remaining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.length > 0
                    ? Math.round((progress.tasksCompleted / tasks.length) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Current Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{goal.title}</span>
                      {goal.completed && (
                        <Badge variant="default">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {goal.current} / {goal.target}
                    </span>
                  </div>
                  <Progress
                    value={(goal.current / goal.target) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Category Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="name" stroke="#737373" />
                    <YAxis stroke="#737373" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Bar dataKey="completed" fill="#000000" name="Completed" />
                    <Bar dataKey="total" fill="#e5e5e5" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="day" stroke="#737373" />
                    <YAxis stroke="#737373" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#000000"
                      strokeWidth={2}
                      name="Tasks Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
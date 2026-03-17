import { BarChart3, TrendingUp, TrendingDown, Activity } from "lucide-react";

// Google-style color palette
const COLORS = {
  primary: {
    blue: "#2563eb",
    lightBlue: "#3b82f6",
    lighter: "#dbeafe",
    pale: "#f0f9ff",
  },
  secondary: {
    gray: "#9ca3af",
    lightGray: "#e5e7eb",
    lighter: "#f3f4f6",
  },
  accent: {
    teal: "#14b8a6",
    green: "#10b981",
    amber: "#f59e0b",
    purple: "#a855f7",
    pink: "#ec4899",
  },
};

export function AnalyticsPage() {
  // Get current day to highlight today
  const today = new Date().getDay();
  const currentDayIndex = today === 0 ? 6 : today - 1; // Mon-Sun

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Performance metrics and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Response Time</h3>
            <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">2.4h</p>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">-15% from last week</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Messages Sent</h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">1,234</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">+12% from last week</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active Chats</h3>
            <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">87</p>
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">+8% from last week</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-green-200 dark:hover:border-green-900 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Satisfaction</h3>
            <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">94%</p>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">+3% from last week</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Volume Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Message Volume</h2>
          <div className="h-64 flex items-end justify-around gap-2">
            {[45, 72, 58, 89, 67, 94, 78].map((height, i) => {
              const isToday = i === currentDayIndex;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative">
                    {/* Bar with gradient */}
                    <div
                      className={`w-full rounded-t-lg transition-all hover:opacity-100 hover:scale-105 origin-bottom ${
                        isToday
                          ? "bg-gradient-to-t from-green-500 to-teal-400"
                          : "bg-gradient-to-t from-blue-500 to-blue-300"
                      }`}
                      style={{ height: `${height}%`, opacity: isToday ? 1 : 0.75 }}
                    />
                    {/* Current day indicator */}
                    {isToday && (
                      <div className="absolute -top-2 right-0 h-2 w-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    isToday
                      ? "text-green-600 dark:text-green-400 font-semibold"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Platform Distribution</h2>
          <div className="space-y-5">
            {[
              { name: "WhatsApp", percentage: 42, color: "bg-green-500" },
              { name: "Instagram", percentage: 28, color: "bg-pink-500" },
              { name: "Facebook", percentage: 20, color: "bg-blue-600" },
              { name: "SMS", percentage: 10, color: "bg-gray-500" },
            ].map((platform) => (
              <div key={platform.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {platform.name}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full">
                    {platform.percentage}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-sm">
                  <div
                    className={`h-full ${platform.color} rounded-full transition-all`}
                    style={{ width: `${platform.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

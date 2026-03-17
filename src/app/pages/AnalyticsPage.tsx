import { BarChart3, TrendingUp, TrendingDown, Activity } from "lucide-react";

export function AnalyticsPage() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Response Time</h3>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">2.4h</p>
          <p className="text-sm text-green-600">-15% from last week</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Messages Sent</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">1,234</p>
          <p className="text-sm text-blue-600">+12% from last week</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Active Chats</h3>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">87</p>
          <p className="text-sm text-purple-600">+8% from last week</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Satisfaction</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">94%</p>
          <p className="text-sm text-green-600">+3% from last week</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Volume Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Message Volume</h2>
          <div className="h-64 flex items-end justify-around gap-2">
            {[45, 72, 58, 89, 67, 94, 78].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Distribution</h2>
          <div className="space-y-4">
            {[
              { name: "WhatsApp", percentage: 42, color: "bg-green-500" },
              { name: "Instagram", percentage: 28, color: "bg-pink-500" },
              { name: "Facebook", percentage: 20, color: "bg-blue-600" },
              { name: "SMS", percentage: 10, color: "bg-gray-500" },
            ].map((platform) => (
              <div key={platform.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{platform.name}</span>
                  <span className="text-sm font-bold text-gray-900">{platform.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${platform.color} rounded-full transition-all`}
                    style={{ width: `${platform.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

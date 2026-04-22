import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { useAuth } from "../contexts/AuthContext";
import { getApiUrl } from "../lib/apiUrl";
import { useStreakAPI } from "../hooks/useStreakAPI";
import { Loader2, Trophy, Flame, CheckCircle, Search } from "lucide-react";
import StreakModal from "./StreakModal";

interface LeaderboardUser {
  id: number;
  username: string;
  totalPoints: number;
  currentStreak: number;
  tasksCompleted: number;
}

const API_URL = getApiUrl();

export function PetTab() {
  const { getAccessToken } = useAuth();
  const { streak, fetchStreak } = useStreakAPI();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/leaderboard/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await response.json();
      const sorted = [...data].sort((a, b) => b.totalPoints - a.totalPoints);
      setLeaderboard(sorted);
      setError(null);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchLeaderboard();
    fetchStreak();
  }, [fetchLeaderboard]);

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredLeaderboard = leaderboard.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = leaderboard.slice(0, 3);
  const restUsers = filteredLeaderboard;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Streak Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card 
          className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setShowStreakModal(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {streak?.current_streak ?? 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              days
            </p>
          </CardContent>
        </Card>

        <Card 
          className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setShowStreakModal(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Longest Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {streak?.longest_streak ?? 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              days
            </p>
          </CardContent>
        </Card>

        <Card 
          className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setShowStreakModal(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Total Days Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {streak?.total_days_active ?? 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Streak Modal */}
      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        currentStreak={streak?.current_streak ?? 0}
        longestStreak={streak?.longest_streak ?? 0}
        totalDaysActive={streak?.total_days_active ?? 0}
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All leaderboard • Compare your progress
          </p>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      {leaderboard.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {topThree.map((user, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <Card
                  key={user.id}
                  className="border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="text-5xl">{medals[index]}</div>

                    <Avatar className="mx-auto h-16 w-16 border border-gray-200 dark:border-gray-700">
                      <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user.username}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Level {Math.floor(user.totalPoints / 100) + 1}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {user.totalPoints}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                          <Flame className="h-3 w-3 text-gray-600 dark:text-gray-300" /> Streak
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {user.currentStreak}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Trophy className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredLeaderboard.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {searchQuery ? "No users found" : "No users on leaderboard yet"}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="hidden md:block space-y-1">
                {restUsers.map((user, origIndex) => {
                  const index = origIndex;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="w-8">
                        <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                          {index + 1}
                        </span>
                        {index < 3 && <span>{["🥇","🥈","🥉"][index]}</span>}
                      </div>

                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                          <AvatarFallback className="text-gray-900 dark:text-white font-semibold text-sm">
                            {getInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {user.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Level {Math.floor(user.totalPoints / 100) + 1}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {user.totalPoints}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Flame className="h-4 w-4" />
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user.currentStreak}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user.tasksCompleted}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="md:hidden space-y-3">
                {restUsers.map((user, origIndex) => {
                  const index = origIndex;
                  return (
                    <Card key={user.id} className="border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                              {index + 1} {index < 3 && ["🥇","🥈","🥉"][index]}
                            </span>
                            <Avatar className="h-12 w-12 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                              <AvatarFallback className="text-gray-900 dark:text-white font-bold text-xs">
                                {getInitials(user.username)}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {user.username}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Level {Math.floor(user.totalPoints / 100) + 1}
                            </p>

                            <div className="grid grid-cols-3 gap-2 mt-3">
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  Points
                                </p>
                                <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                                  {user.totalPoints}
                                </p>
                              </div>

                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  Streak
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                  <Flame className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                                  <p className="text-base font-bold text-gray-900 dark:text-white">
                                    {user.currentStreak}
                                  </p>
                                </div>
                              </div>

                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  Tasks
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                  <CheckCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                                  <p className="text-base font-bold text-gray-900 dark:text-white">
                                    {user.tasksCompleted}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <CardContent className="pt-6 space-y-2 text-sm">
          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Trophy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <strong>Rankings are based on total points earned from completed tasks</strong>
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Complete tasks to earn points and improve your ranking. Streaks are tracked daily!
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-2">
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="px-6 py-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? "Refreshing..." : "Refresh Leaderboard"}
        </button>
      </div>
    </div>
  );
}

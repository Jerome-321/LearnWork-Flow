import { Card, CardContent } from "../ui/card";
import { Zap, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface ProductivityAlternative {
  time: string; // "19:00"
  score: number; // 0-100
  reason: string; // "You're 91% likely to complete here"
}

interface ProductivityScoreDisplayProps {
  currentTime: string;
  currentScore: number; // 0-100
  currentReason: string;
  alternatives: ProductivityAlternative[];
  onSelectAlternative?: (time: string) => void;
  isCompact?: boolean; // Show as inline badge vs full card
}

/**
 * Q5/Q6: Productivity score display with alternatives
 * Shows productivity prediction and suggests better time slots
 * Mobile-responsive, color-coded scoring
 */
export function ProductivityScoreDisplay({
  currentTime,
  currentScore,
  currentReason,
  alternatives,
  onSelectAlternative,
  isCompact = false,
}: ProductivityScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return "bg-green-50";
    if (score >= 50) return "bg-amber-50";
    return "bg-red-50";
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 75) return "border-green-200";
    if (score >= 50) return "border-amber-200";
    return "border-red-200";
  };

  // Compact version (inline badge)
  if (isCompact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getScoreBgColor(
          currentScore
        )} ${getScoreBorderColor(currentScore)}`}
      >
        <Zap className={`h-3 w-3 ${getScoreColor(currentScore)}`} />
        <span className={getScoreColor(currentScore)}>
          {currentScore}/100 productivity
        </span>
      </div>
    );
  }

  // Full card version
  return (
    <Card className={`border ${getScoreBorderColor(currentScore)} ${getScoreBgColor(currentScore)}`}>
      <CardContent className="p-4 md:p-6">
        {/* Current Score */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-700">
                Productivity at {currentTime}
              </p>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                {currentReason}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl md:text-4xl font-bold ${getScoreColor(currentScore)}`}>
                {currentScore}
              </div>
              <div className="text-xs text-gray-600 font-medium">/100</div>
            </div>
          </div>

          {/* Score Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                currentScore >= 75
                  ? "bg-green-500"
                  : currentScore >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${currentScore}%` }}
            />
          </div>

          {/* Score Label */}
          <div className="text-xs md:text-sm font-medium">
            {currentScore >= 75 && (
              <p className="text-green-700 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Excellent time slot
              </p>
            )}
            {currentScore >= 50 && currentScore < 75 && (
              <p className="text-amber-700 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Decent time, but see alternatives below
              </p>
            )}
            {currentScore < 50 && (
              <p className="text-red-700 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Low productivity here
              </p>
            )}
          </div>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <>
            <div className="mt-6 pt-6 border-t border-current border-opacity-20">
              <p className="text-xs md:text-sm font-medium text-gray-900 mb-3">
                Better time slots today:
              </p>
              <div className="space-y-2">
                {alternatives.map((alt) => (
                  <div
                    key={alt.time}
                    className="flex items-center justify-between gap-2 p-2 md:p-3 bg-white rounded border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-900">
                        {alt.time}
                      </p>
                      <p className="text-xs text-gray-600">
                        {alt.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm md:text-lg font-bold text-green-600">
                          {alt.score}
                        </div>
                        <div className="text-xs text-gray-500">/100</div>
                      </div>
                      {onSelectAlternative && (
                        <Button
                          size="sm"
                          onClick={() => onSelectAlternative(alt.time)}
                          className="text-xs px-2 md:px-3 bg-green-600 hover:bg-green-700"
                        >
                          Use
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Info */}
        <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-current border-opacity-20">
          📊 Scores are based on your actual completion history. Schedule tasks at higher-scoring times for better success.
        </p>
      </CardContent>
    </Card>
  );
}

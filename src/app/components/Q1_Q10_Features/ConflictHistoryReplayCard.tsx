import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

interface PastConflict {
  date: string; // "October 3, 2025"
  item1Title: string;
  item2Title: string;
  resolution: string;
  userSatisfaction: number; // 1-5
  similarity: number; // 0.65-1.0
}

interface ConflictHistoryReplayCardProps {
  newConflict: {
    item1Title: string;
    item2Title: string;
  };
  pastConflict: PastConflict;
  onApplyResolution: () => void;
  onShowOtherOptions: () => void;
  isLoading?: boolean;
}

/**
 * Q10: Conflict history replay card
 * Shows similar past conflicts and suggests applying the same resolution
 * Mobile-responsive, shows similarity score and user satisfaction
 */
export function ConflictHistoryReplayCard({
  newConflict,
  pastConflict,
  onApplyResolution,
  onShowOtherOptions,
  isLoading = false,
}: ConflictHistoryReplayCardProps) {
  const similarityPercent = Math.round(pastConflict.similarity * 100);
  const satisfactionStars = Array(Math.round(pastConflict.userSatisfaction))
    .fill(null)
    .map((_, i) => i);

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle className="text-base md:text-lg text-green-900">
                Similar Past Conflict
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {pastConflict.date}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg md:text-xl font-bold text-green-600">
              {similarityPercent}%
            </div>
            <div className="text-xs text-green-700">Similar</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Past Conflict Details */}
        <div className="bg-white rounded-lg p-3 border border-green-200">
          <p className="text-xs md:text-sm font-medium text-gray-900 mb-2">
            Past conflict:
          </p>
          <p className="text-xs md:text-sm text-gray-700">
            "{pastConflict.item1Title}" vs "{pastConflict.item2Title}"
          </p>
        </div>

        {/* Current Conflict */}
        <div className="bg-white rounded-lg p-3 border border-green-200">
          <p className="text-xs md:text-sm font-medium text-gray-900 mb-2">
            Your current conflict:
          </p>
          <p className="text-xs md:text-sm text-gray-700">
            "{newConflict.item1Title}" vs "{newConflict.item2Title}"
          </p>
        </div>

        {/* Past Resolution */}
        <div className="bg-green-100 rounded-lg p-3 border border-green-300">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs md:text-sm font-medium text-green-900">
                How you resolved it:
              </p>
              <p className="text-xs md:text-sm text-green-800 mt-1">
                {pastConflict.resolution}
              </p>
            </div>
          </div>

          {/* Satisfaction */}
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-green-700 font-medium">You rated:</span>
            <div className="flex gap-0.5">
              {satisfactionStars.map((_, i) => (
                <span key={i} className="text-yellow-500">★</span>
              ))}
              {Array(5 - pastConflict.userSatisfaction).fill(null).map((_, i) => (
                <span key={`empty-${i}`} className="text-gray-300">★</span>
              ))}
            </div>
            <span className="text-xs text-green-700">
              ({pastConflict.userSatisfaction}/5)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            onClick={onApplyResolution}
            disabled={isLoading}
            className="text-xs md:text-sm bg-green-600 hover:bg-green-700 text-white flex-1"
          >
            {isLoading ? "Applying..." : "Apply Same Resolution"}
          </Button>
          <Button
            variant="outline"
            onClick={onShowOtherOptions}
            disabled={isLoading}
            className="text-xs md:text-sm border-green-300 text-green-900 hover:bg-green-100 flex-1 sm:flex-initial"
          >
            Show Other Options
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-green-700 text-center pt-1">
          💡 This approach worked well for you before ({similarityPercent}% similar)
        </p>
      </CardContent>
    </Card>
  );
}

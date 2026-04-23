import { AlertCircle, X, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";

interface RecurringConflictBannerProps {
  title: string;
  message: string;
  conflict: {
    type: string; // "task_vs_work", "event_vs_work", etc.
    day: string; // "Wednesday"
    occurrences: number; // 3+
    item1Title: string;
    item2Title: string;
  };
  onDismiss: () => void;
  onReviewOptions: () => void;
}

/**
 * Q2: Recurring conflict detection banner
 * Appears when same conflict happens 3+ times
 * Shows pattern and suggests permanent restructuring
 * Mobile-responsive, dismissible
 */
export function RecurringConflictBanner({
  title,
  message,
  conflict,
  onDismiss,
  onReviewOptions,
}: RecurringConflictBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 md:p-6">
      <div className="flex gap-3 md:gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-600 flex-shrink-0" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-amber-900 text-sm md:text-base">
              {title}
            </h3>
            <p className="text-xs md:text-sm text-amber-800">
              {message}
            </p>

            {/* Pattern Details */}
            <div className="mt-2 text-xs text-amber-700 space-y-1">
              <p>
                <span className="font-medium">Pattern:</span> Every {conflict.day}
              </p>
              <p>
                <span className="font-medium">Conflict:</span> "{conflict.item1Title}" vs "{conflict.item2Title}"
              </p>
              <p>
                <span className="font-medium">Occurred:</span> {conflict.occurrences} times in the last 3 weeks
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              onClick={onReviewOptions}
              className="text-xs md:text-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1"
            >
              Review Options
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="text-xs md:text-sm border-amber-200 text-amber-900 hover:bg-amber-100"
            >
              Dismiss
            </Button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-amber-600 hover:text-amber-900 transition-colors"
        >
          <X className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>

      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-amber-200">
        <p className="text-xs text-amber-700">
          💡 <span className="font-medium">Tip:</span> This pattern repeats weekly. 
          Consider a permanent schedule change to prevent ongoing conflicts.
        </p>
      </div>
    </div>
  );
}

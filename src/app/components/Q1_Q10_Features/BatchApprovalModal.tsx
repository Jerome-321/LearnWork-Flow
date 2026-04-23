import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { RefreshCw, Check } from "lucide-react";
import { useState } from "react";

interface BatchApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictPattern: {
    day: string; // "Wednesday"
    startTime: string; // "14:00"
    endTime: string; // "15:00"
    item1Title: string;
    item2Title: string;
  };
  resolution: string; // "Reschedule study to 18:00-20:00"
  onApplyToFuture: (weeks: number) => void; // Number of weeks to apply (52 = 1 year)
  onApplyOnce: () => void;
  isLoading?: boolean;
}

/**
 * Q10: Batch approval modal for recurring conflicts
 * Allows applying same resolution to future occurrences (1 week, 1 month, 1 year)
 * Mobile-responsive, clear duration options
 */
export function BatchApprovalModal({
  isOpen,
  onClose,
  conflictPattern,
  resolution,
  onApplyToFuture,
  onApplyOnce,
  isLoading = false,
}: BatchApprovalModalProps) {
  const [selectedOption, setSelectedOption] = useState<"once" | "month" | "year">(
    "year"
  );

  const handleApply = () => {
    if (selectedOption === "once") {
      onApplyOnce();
    } else if (selectedOption === "month") {
      onApplyToFuture(4); // 4 weeks
    } else {
      onApplyToFuture(52); // 52 weeks
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            <DialogTitle className="text-lg">Apply to Future Occurrences?</DialogTitle>
          </div>
          <DialogDescription className="text-sm mt-2">
            This conflict repeats every {conflictPattern.day}.
          </DialogDescription>
        </DialogHeader>

        {/* Pattern Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 my-4">
          <p className="text-xs md:text-sm text-blue-900">
            <span className="font-medium">Pattern:</span> Every {conflictPattern.day} {conflictPattern.startTime}-{conflictPattern.endTime}
          </p>
          <p className="text-xs md:text-sm text-blue-900 mt-1">
            <span className="font-medium">Conflict:</span> "{conflictPattern.item1Title}" vs "{conflictPattern.item2Title}"
          </p>
          <p className="text-xs md:text-sm text-blue-900 mt-1">
            <span className="font-medium">Resolution:</span> {resolution}
          </p>
        </div>

        {/* Duration Options */}
        <div className="space-y-3 py-4">
          <div
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => setSelectedOption("once")}
          >
            <Checkbox
              checked={selectedOption === "once"}
              disabled={isLoading}
              onCheckedChange={() => setSelectedOption("once")}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Just this week</p>
              <p className="text-xs text-gray-600">Apply once, then ask again next time</p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => setSelectedOption("month")}
          >
            <Checkbox
              checked={selectedOption === "month"}
              disabled={isLoading}
              onCheckedChange={() => setSelectedOption("month")}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Next 4 weeks</p>
              <p className="text-xs text-gray-600">Apply to this month's occurrences</p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors ring-2 ring-blue-200"
            onClick={() => setSelectedOption("year")}
          >
            <Checkbox
              checked={selectedOption === "year"}
              disabled={isLoading}
              onCheckedChange={() => setSelectedOption("year")}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Next year (recommended)</p>
              <p className="text-xs text-gray-600">Apply to all future occurrences (52 weeks)</p>
            </div>
            <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-xs text-blue-900">
            💡 You can always change this later. We'll send you a reminder if needed.
          </p>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isLoading}
            className="text-sm bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Applying..." : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

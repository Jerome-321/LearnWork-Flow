import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Star, CheckCircle } from "lucide-react";
import { useState } from "react";

interface TaskCompletionFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  onSubmit: (satisfaction: number, feedback?: string) => void;
  isLoading?: boolean;
}

/**
 * Q6: Task completion form with satisfaction rating (1-5 stars)
 * Captures user feedback for ML learning loop
 * Mobile-responsive with star rating
 */
export function TaskCompletionForm({
  isOpen,
  onClose,
  taskTitle,
  onSubmit,
  isLoading = false,
}: TaskCompletionFormProps) {
  const [satisfaction, setSatisfaction] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [hoverStar, setHoverStar] = useState(0);

  const handleSubmit = () => {
    onSubmit(satisfaction, feedback);
    setSatisfaction(5);
    setFeedback("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <DialogTitle className="text-lg">Task Completed!</DialogTitle>
          </div>
          <DialogDescription className="text-sm mt-2">
            <span className="font-medium text-gray-900">{taskTitle}</span>
            <p className="mt-1">How satisfied are you with this completion?</p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setSatisfaction(star)}
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(0)}
                disabled={isLoading}
                className="transition-transform hover:scale-110 disabled:opacity-50"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverStar || satisfaction)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Labels */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {satisfaction === 1 && "Could have gone better"}
              {satisfaction === 2 && "Below expectations"}
              {satisfaction === 3 && "Met expectations"}
              {satisfaction === 4 && "Good work"}
              {satisfaction === 5 && "Excellent!"}
            </p>
          </div>

          {/* Optional Feedback */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Additional feedback (optional)
            </label>
            <Textarea
              placeholder="What could have improved this task? Any challenges?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isLoading}
              className="text-sm resize-none h-24"
            />
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center">
            This helps us learn your productivity patterns 📊
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="text-sm bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Saving..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { HelpCircle } from "lucide-react";

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  question: string;
  options: string[];
  onAnswer: (selectedOption: string) => void;
  isLoading?: boolean;
}

/**
 * Q3: Single-question clarification modal for ambiguous task intent
 * Distinguishes between "birthday party" (event) vs "study for birthday" (task)
 * Mobile-responsive, single question (not a form)
 */
export function ClarificationModal({
  isOpen,
  onClose,
  title,
  question,
  options,
  onAnswer,
  isLoading = false,
}: ClarificationModalProps) {
  const handleAnswer = (option: string) => {
    onAnswer(option);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm mt-2">
            {question}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={isLoading}
              className="w-full p-3 text-left rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-gray-300 flex items-center justify-center">
                  {isLoading ? (
                    <div className="h-2 w-2 bg-gray-300 rounded-full animate-pulse" />
                  ) : null}
                </div>
                <span className="text-sm text-gray-700">{option}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-sm"
          >
            Skip
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-2">
          This helps us better understand your task 
        </p>
      </DialogContent>
    </Dialog>
  );
}

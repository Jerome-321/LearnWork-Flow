import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Flame, Trophy, Calendar } from "lucide-react";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
}

export default function StreakModal({
  isOpen,
  onClose,
  currentStreak,
  longestStreak,
  totalDaysActive,
}: StreakModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Flame className="h-6 w-6 text-orange-500" />
            Your Streak
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
            <Flame className="h-16 w-16 text-orange-500 mb-2" />
            <div className="text-5xl font-bold text-orange-600">{currentStreak}</div>
            <div className="text-sm text-gray-600 mt-1">Day Streak</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
              <Trophy className="h-8 w-8 text-yellow-600 mb-2" />
              <div className="text-2xl font-bold text-yellow-700">{longestStreak}</div>
              <div className="text-xs text-gray-600 text-center">Longest Streak</div>
            </div>

            <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-700">{totalDaysActive}</div>
              <div className="text-xs text-gray-600 text-center">Total Days Active</div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            {currentStreak > 0 
              ? "Keep it up! Complete tasks daily to maintain your streak."
              : "Start your streak by completing a task today!"}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

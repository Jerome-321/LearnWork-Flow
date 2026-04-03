import { useState, useEffect, type SyntheticEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trophy, Flame, X } from "lucide-react";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

export function VirtualPet() {
  const { progress } = useTaskAPI();
  const [isExpanded, setIsExpanded] = useState(false);

  const progressData = progress ?? {
    petStage: "egg",
    currentStreak: 0,
    totalPoints: 0,
    tasksCompleted: 0,
    petLevel: 0,
  };

  const getPetImage = (level: number) => {
    // Use known image file names from PET folder
    if (level === 0) return "/PET/lvl0.png";
    if (level === 0.1) return "/PET/lvl0.1.png";
    if (level === 0.11) return "/PET/level0.1.png";

    const rounded = Math.floor(level);
    if (rounded >= 1 && rounded <= 4) {
      return `/PET/lvl${rounded}.png`;
    }

    // Fallback to egg
    return "/PET/lvl0.png";
  };

  const getPetName = () => {
    switch (progressData.petStage) {
      case "egg":
        return "Egg";
      case "baby":
        return "Hatchling";
      case "teen":
        return "Fledgling";
      case "adult":
        return "Flyer";
      case "master":
        return "Sky Master";
      default:
        return "Egg";
    }
  };

  const getPetMessage = () => {
    if (progressData.currentStreak === 0) {
      return "Complete a task to start your streak!";
    } else if (progressData.currentStreak >= 7) {
      return "Amazing streak! Keep it up! 🌟";
    } else if (progressData.currentStreak >= 3) {
      return "Great progress! You're on fire! 🔥";
    } else {
      return "Let's keep growing together! 💪";
    }
  };

  const getNextMilestone = () => {
    const milestones = [100, 300, 700, 1500];
    return milestones.find((m) => m > progress.totalPoints) || 2000;
  };

  const nextMilestone = getNextMilestone();
  const progressToNext = ((progressData.totalPoints % nextMilestone) / nextMilestone) * 100;

  const defaultPetImage = getPetImage(progressData.petLevel ?? 0);
  const [petImage, setPetImage] = useState(defaultPetImage);

  useEffect(() => {
    setPetImage(getPetImage(progressData.petLevel ?? 0));
  }, [progressData.petLevel]);

  const onPetImageError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.currentTarget;
    if (target.src.indexOf("/PET/lvl0.png") === -1) {
      target.src = "/PET/lvl0.png";
      setPetImage("/PET/lvl0.png");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {isExpanded ? (
          <Card className="w-72 overflow-hidden shadow-xl border-2">
            <div className="relative bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex flex-col items-center">
                {/* Pet Display */}
                <motion.div
                  className="relative h-24 w-24 mb-2"
                  animate={{
                    y: [0, -8, 0],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <img
                    key={progressData.petLevel}
                    src={petImage}
                    alt={getPetName()}
                    onError={onPetImageError}
                    className="h-full w-full rounded-lg object-contain"
                  />

                  {progress.petLevel >= 5 && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    </motion.div>
                  )}
                </motion.div>

                <h3 className="font-semibold text-base mt-2">
                  {getPetName()}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Level {progressData.petLevel}
                </p>

                {/* Pet Message */}
                <div className="mt-3 w-full bg-white/50 dark:bg-black/20 rounded-lg p-2 border border-border/50">
                  <p className="text-xs text-center leading-relaxed">
                    "{getPetMessage()}"
                  </p>
                </div>

                {/* Progress to Next Evolution */}
                <div className="mt-3 w-full">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">Next Evolution</span>
                    <span className="font-medium">{progress.totalPoints} / {nextMilestone}</span>
                  </div>
                  <Progress value={progressToNext} className="h-2" />
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4 bg-card">
              <div className="flex items-center justify-between rounded-md bg-secondary p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Points</span>
                </div>
                <span className="font-semibold">{progress.totalPoints}</span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-secondary p-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Streak</span>
                </div>
                <span className="font-semibold">{progress.currentStreak} days</span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-secondary p-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <span className="font-semibold">{progress.tasksCompleted}</span>
              </div>
            </div>
          </Card>
        ) : (
          <motion.button
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 shadow-lg border-2 border-border hover:shadow-xl transition-shadow"
            onClick={() => setIsExpanded(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.img
              key={progressData.petLevel}
              src={petImage}
              alt={getPetName()}
              onError={onPetImageError}
              className="h-8 w-8 object-contain filter drop-shadow-md"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Streak Badge */}
            {progress.currentStreak > 0 && (
              <motion.div
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground border-2 border-background shadow-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {progress.currentStreak}
              </motion.div>
            )}

            {/* Sparkle effect for high levels */}
            {progress.petLevel >= 5 && (
              <motion.div
                className="absolute -top-1 -left-1"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </motion.div>
            )}
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

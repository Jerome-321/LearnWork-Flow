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

  // Ensure new users with egg stage start at level 0, not 1
  const currentLevel = progressData.petStage === "egg" ? 0 : progressData.petLevel;

  const STORAGE_KEY = "LearnWorkFlowPetAssignments";

  const levelMapping: Record<string, { folder: string; category: string; options: string[] }> = {
    "0": { folder: "PET LEVEL 0", category: "egg", options: ["level 0.png", "level 0.0.png"] },
    "0.1": { folder: "PET LEVEL 0.1", category: "hatchling", options: ["level 0.1.png", "level0.1.png"] },
    "1": { folder: "PET LEVEL 1", category: "teen", options: ["level 1.png", "level1.png"] },
    "2": { folder: "PET LEVEL 2", category: "young", options: ["level 2.png", "level2.png"] },
    "3": { folder: "PET LEVEL 3", category: "adult", options: ["level 3.png", "level3.png"] },
    "4": { folder: "PET LEVEL 4", category: "master", options: ["level 4.png", "level4.png"] },
  };

  const getStorageAssignments = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const setStorageAssignments = (assignments: Record<string, string>) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch {
      // ignore localStorage errors
    }
  };

  const pickRandom = <T,>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
  };

  const getPetImage = (level: number): string => {
    const levelKey = level === 0.1 ? "0.1" : String(level).replace(".0", "");
    const mapping = levelMapping[levelKey];
    const assignments = getStorageAssignments();

    const resolvePath = (fileName: string) => {
      const folder = mapping?.folder ? `PET/${mapping.folder}` : "PET";
      return encodeURI(`/${folder}/${fileName}`);
    };

    if (assignments[levelKey]) {
      return resolvePath(assignments[levelKey]);
    }

    if (!mapping?.options?.length) {
      return encodeURI("/PET/PET LEVEL 0/level 0.png");
    }

    const chosen = pickRandom(mapping.options);
    const newAssignments = { ...assignments, [levelKey]: chosen };
    setStorageAssignments(newAssignments);

    const categoryTag = mapping.category || "egg";
    console.debug(`Pet level ${levelKey} (${categoryTag}) selected: ${chosen}`);

    return resolvePath(chosen);
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
    return milestones.find((m) => m > progressData.totalPoints) || 2000;
  };

  const nextMilestone = getNextMilestone();
  const progressToNext = ((progressData.totalPoints % nextMilestone) / nextMilestone) * 100;

  const defaultPetImage = getPetImage(currentLevel);
  const [petImage, setPetImage] = useState(defaultPetImage);

  useEffect(() => {
    setPetImage(getPetImage(currentLevel));
  }, [currentLevel]);

  const onPetImageError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.currentTarget;
    const fallback = encodeURI("/PET/PET LEVEL 0/level 0.png");
    if (target.src !== fallback) {
      target.src = fallback;
      setPetImage(fallback);
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
                  className="relative h-32 w-32 mb-2"
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
                    style={{ maxWidth: "100%", maxHeight: "100%", display: "block" }}
                  />

                  {progressData.petLevel >= 5 && (
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
                  Level {currentLevel}
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
                    <span className="font-medium">{progressData.totalPoints} / {nextMilestone}</span>
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
                <span className="font-semibold">{progressData.totalPoints}</span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-secondary p-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Streak</span>
                </div>
                <span className="font-semibold">{progressData.currentStreak} days</span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-secondary p-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <span className="font-semibold">{progressData.tasksCompleted}</span>
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
              className="h-16 w-16 object-contain filter drop-shadow-md"
              style={{ maxWidth: "100%", maxHeight: "100%", display: "block" }}
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
            {progressData.currentStreak > 0 && (
              <motion.div
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground border-2 border-background shadow-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {progressData.currentStreak}
              </motion.div>
            )}

            {/* Sparkle effect for high levels */}
            {progressData.petLevel >= 5 && (
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

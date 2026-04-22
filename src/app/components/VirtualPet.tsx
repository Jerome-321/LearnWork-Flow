import { useState, useEffect, type SyntheticEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trophy, Flame, X, Users } from "lucide-react";
import { useTaskAPI } from "../hooks/useTaskAPI";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { PetTab } from "./PetTab";

const POSITION_STORAGE_KEY = "LearnWorkFlowPetPosition";

const getDefaultPosition = () => {
  if (typeof window === "undefined") return null;
  return {
    x: window.innerWidth - (window.innerWidth < 640 ? 72 : 80),
    y: window.innerHeight - (window.innerWidth < 640 ? 136 : 144)
  };
};

export function VirtualPet() {
  const { progress } = useTaskAPI();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window === "undefined") return null;
    
    try {
      const stored = localStorage.getItem(POSITION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const petSize = window.innerWidth < 640 ? 56 : 64;
        
        if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number' &&
            parsed.x >= 0 && parsed.x <= viewportWidth - petSize &&
            parsed.y >= 0 && parsed.y <= viewportHeight - petSize) {
          return parsed;
        } else {
          localStorage.removeItem(POSITION_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(POSITION_STORAGE_KEY);
    }
    
    return getDefaultPosition();
  });

  const progressData = progress ?? {
    petStage: "egg",
    currentStreak: 0,
    totalPoints: 0,
    tasksCompleted: 0,
    petLevel: 0,
  };

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

  useEffect(() => {
    const handleResize = () => {
      if (!position) return;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const petSize = window.innerWidth < 640 ? 56 : 64;
      
      if (position.x < 0 || position.x > viewportWidth - petSize || 
          position.y < 0 || position.y > viewportHeight - petSize) {
        const newPos = getDefaultPosition();
        setPosition(newPos);
        if (newPos) {
          localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(newPos));
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  useEffect(() => {
    if (typeof window !== "undefined" && position) {
      try {
        localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
      } catch {
        // ignore localStorage errors
      }
    }
  }, [position]);

  const handleDragStart = () => {
    setIsDragging(true);
    setDragStartTime(Date.now());
  };

  const handleDrag = (_event: any, info: any) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const petSize = window.innerWidth < 640 ? 56 : 64;
    
    let newX = info.point.x - petSize / 2;
    let newY = info.point.y - petSize / 2;
    
    newX = Math.max(0, Math.min(newX, viewportWidth - petSize));
    newY = Math.max(0, Math.min(newY, viewportHeight - petSize));
    
    setPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    const dragDuration = Date.now() - dragStartTime;
    if (dragDuration < 200) {
      setIsDragging(false);
      return;
    }
    
    setTimeout(() => setIsDragging(false), 100);
  };

  const onPetImageError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.currentTarget;
    const fallback = encodeURI("/PET/PET LEVEL 0/level 0.png");
    if (target.src !== fallback) {
      target.src = fallback;
      setPetImage(fallback);
    }
  };

  if (!position) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed z-[60] cursor-grab active:cursor-grabbing"
          style={{
            left: position.x,
            top: position.y,
            touchAction: 'none',
            userSelect: 'none',
          }}
          drag
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {isExpanded ? (
            <Card className="w-64 sm:w-72 overflow-hidden shadow-xl border-2">
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
                  <motion.div
                    className="relative h-24 w-24 sm:h-32 sm:w-32 mb-2"
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

                  <div className="mt-3 w-full bg-white/50 dark:bg-black/20 rounded-lg p-2 border border-border/50">
                    <p className="text-xs text-center leading-relaxed">
                      "{getPetMessage()}"
                    </p>
                  </div>

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
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setIsExpanded(false);
                    setShowLeaderboard(true);
                  }}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">View Leaderboard</span>
                </Button>

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
              className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 shadow-lg border-2 border-border hover:shadow-xl transition-shadow"
              onClick={() => !isDragging && setIsExpanded(true)}
              whileHover={{ scale: isDragging ? 1 : 1.1 }}
              whileTap={{ scale: isDragging ? 1 : 0.95 }}
            >
              <motion.img
                key={progressData.petLevel}
                src={petImage}
                alt={getPetName()}
                onError={onPetImageError}
                className="h-14 w-14 sm:h-16 sm:w-16 object-contain filter drop-shadow-md"
                style={{ maxWidth: "100%", maxHeight: "100%", display: "block" }}
                animate={{
                  rotate: isDragging ? 0 : [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: isDragging ? 0 : Infinity,
                  ease: "easeInOut",
                }}
              />
              
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

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-[70]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaderboard(false)}
            />
            
            {/* Leaderboard Panel */}
            <motion.div
              className="fixed bottom-0 right-0 top-0 w-full sm:w-[500px] md:w-[600px] lg:w-[700px] bg-background shadow-2xl z-[71] overflow-hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">Leaderboard</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLeaderboard(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <PetTab />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

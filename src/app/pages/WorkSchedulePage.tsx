import { useState } from "react";
import { useOutletContext } from "react-router";
import { Task, WorkSchedule } from "../types/task";
import { useWorkScheduleAPI } from "../hooks/useWorkScheduleAPI";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayAbbrev: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const displayDays = (days: string[] | string) => {
  const daysArray = Array.isArray(days) ? days : (typeof days === 'string' ? JSON.parse(days) : []);
  return daysArray.map((d) => dayAbbrev[d] || d.slice(0, 3)).join(", ");
};

interface OutletContext {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tasks: Task[];
}

export function WorkSchedulePage() {
  const { tasks } = useOutletContext<OutletContext>();
  const { schedules, loading, addSchedule, updateSchedule, deleteSchedule, suggestSchedule } = useWorkScheduleAPI();

  const [editing, setEditing] = useState<WorkSchedule | null>(null);
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [workType, setWorkType] = useState("Morning");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setEditing(null);
    setWorkDays([]);
    setStartTime("");
    setEndTime("");
    setWorkType("Morning");
    setNotes("");
  };

  const formatTime12Hour = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${suffix}`;
  };

  const toggleDay = (day: string) => {
    setWorkDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const validate = () => {
    if (!workDays.length) {
      toast.error("Select at least one work day");
      return false;
    }
    if (!startTime || !endTime) {
      toast.error("Start and end times are required");
      return false;
    }

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    // allow over-midnight schedule (e.g. 19:30 -> 01:30)
    if (endMin === startMin) {
      toast.error("End time must be after start time");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      job_title: "Work Schedule",
      work_days: workDays,
      start_time: startTime,
      end_time: endTime,
      work_type: workType,
      notes: notes.trim(),
    };

    try {
      if (editing) {
        await updateSchedule(editing.id, payload);
        toast.success("Work schedule updated");
      } else {
        await addSchedule(payload);
        toast.success("Work schedule created");
      }
      resetForm();
      
      // Get AI suggestion
      try {
        const suggestion = await suggestSchedule(payload);
        if (suggestion.suggestion && suggestion.reason) {
          toast.info(`${suggestion.suggestion}\n\n${suggestion.reason}`, {
            duration: 10000, // longer duration for suggestions
          });
        }
      } catch (err) {
        // Ignore suggestion errors
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to save schedule");
    }
  };

  const academicTasks = tasks.filter((t) => t.category === "academic");

  const scheduleConflicts = schedules.map((schedule) => {
    const workDaysArray = Array.isArray(schedule.work_days) ? schedule.work_days : (typeof schedule.work_days === 'string' ? JSON.parse(schedule.work_days) : []);
    const conflicts = academicTasks
      .filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        const day = taskDate.toLocaleDateString("en-US", { weekday: "long" });
        const time24 = taskDate.toTimeString().slice(0, 5);
        return (
          workDaysArray.includes(day) &&
          time24 >= schedule.start_time &&
          time24 <= schedule.end_time
        );
      })
      .map((task) => {
        const taskDate = new Date(task.dueDate);
        const dueTime = formatTime12Hour(taskDate.toTimeString().slice(0, 5));
        const conflictRange = `${formatTime12Hour(schedule.start_time)} – ${formatTime12Hour(schedule.end_time)}`;
        return {
          title: task.title,
          dueTime,
          conflictRange,
          message: `⚠ Conflict with '${task.title}' (${conflictRange}). Your work schedule overlaps at ${dueTime}.`,
        };
      });

    return { schedule, conflicts };
  });

  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Work Schedule</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {schedules.length} schedules • {academicTasks.length} academic tasks
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-64 overflow-auto" style={{ minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
        {/* Overview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
              {schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">No work schedules created yet</p>
              ) : (
                schedules.map((schedule) => {
                  const conflict = scheduleConflicts.find((item) => item.schedule.id === schedule.id);
                  return (
                    <Card key={schedule.id} className="relative">
                      {conflict?.conflicts.length ? (
                        <Badge variant="destructive" className="absolute top-3 right-3 text-xs">
                          Conflict
                        </Badge>
                      ) : null}
                      <CardHeader>
                        <CardTitle className="text-base">{schedule.job_title?.trim() || "Work Schedule"}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          Days: {displayDays(schedule.work_days)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Time: {formatTime12Hour(schedule.start_time)} - {formatTime12Hour(schedule.end_time)}
                        </div>
                        <div className="text-sm text-muted-foreground">Type: {schedule.work_type}</div>
                        {schedule.notes && <div className="text-sm">Notes: {schedule.notes}</div>}

                        {conflict?.conflicts.length ? (
                          <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700 text-xs">
                            {conflict.conflicts.map((it) => (
                              <p key={`${schedule.id}-${it.title}`}>{it.message}</p>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(schedule);
                              const workDaysArray = Array.isArray(schedule.work_days) ? schedule.work_days : (typeof schedule.work_days === 'string' ? JSON.parse(schedule.work_days) : []);
                              setWorkDays(workDaysArray);
                              setStartTime(schedule.start_time);
                              setEndTime(schedule.end_time);
                              setWorkType(schedule.work_type);
                              setNotes(schedule.notes);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              try {
                                await deleteSchedule(schedule.id);
                                toast.success("Schedule deleted");
                              } catch (err: any) {
                                toast.error(err?.message || "Delete failed");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Work Schedule Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Work Schedule" : "Add Work Schedule"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Form */}
              <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Work Days</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {weekdays.map((day) => (
                        <label key={day} className="flex items-center gap-2">
                          <Checkbox
                            checked={workDays.includes(day)}
                            onCheckedChange={() => toggleDay(day)}
                          />
                          <span>{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ws-start-time">Start Time</Label>
                      <Input
                        id="ws-start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ws-end-time">End Time</Label>
                      <Input
                        id="ws-end-time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Work Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['Morning', 'Afternoon', 'Night', 'Flexible'].map((type) => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="workType"
                            value={type}
                            checked={workType === type}
                            onChange={() => setWorkType(type)}
                            className="h-3 w-3"
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ws-notes">Notes</Label>
                    <Textarea
                      id="ws-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Optional notes"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editing ? "Update" : "Create"}
                    </Button>
                    {editing && (
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

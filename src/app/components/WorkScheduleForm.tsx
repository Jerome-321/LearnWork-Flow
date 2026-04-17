import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import { useTaskAPI } from "../hooks/useTaskAPI";

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function WorkScheduleForm({ onSuccess }: { onSuccess?: () => void }) {
  const { addTask, syncData } = useTaskAPI();
  const [title, setTitle] = useState("");
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [workType, setWorkType] = useState("Morning");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: string) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const validate = () => {
    if (!title.trim()) {
      toast.error("Job title is required");
      return false;
    }

    if (!workDays.length) {
      toast.error("Select at least one work day");
      return false;
    }

    if (!startTime || !endTime) {
      toast.error("Start time and end time are required");
      return false;
    }

    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      title: title.trim(),
      category: "work_schedule",
      description: JSON.stringify({
        text: notes.trim(),
        schedule: {
          type: "weekly",
          work_days: Array.isArray(workDays) ? workDays : [],
          start_time: startTime,
          end_time: endTime,
          work_type: workType,
        },
      }),
      priority: "medium",
      completed: false,
      points: 0,
    };

    setSaving(true);

    try {
      await addTask(payload as any);
      await syncData();
      toast.success("Work schedule saved successfully");
      setTitle("");
      setWorkDays([]);
      setStartTime("");
      setEndTime("");
      setWorkType("Morning");
      setNotes("");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Could not save schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>New Work Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ws-title">Job Title</Label>
            <Input
              id="ws-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter job title"
            />
          </div>

          <div>
            <Label>Work Days</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {weekdays.map((day) => (
                <label key={day} className="flex items-center gap-2">
                  <Checkbox
                    checked={workDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <span>{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ws-start">Start Time</Label>
              <Input
                id="ws-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ws-end">End Time</Label>
              <Input
                id="ws-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Work Type</Label>
            <div className="space-y-2 mt-2">
              {['Morning', 'Afternoon', 'Night', 'Flexible'].map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="workType"
                    value={option}
                    checked={workType === option}
                    onChange={() => setWorkType(option)}
                    className="h-4 w-4"
                  />
                  <span>{option}</span>
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
              placeholder="Additional schedule notes (optional)"
              rows={4}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Work Schedule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

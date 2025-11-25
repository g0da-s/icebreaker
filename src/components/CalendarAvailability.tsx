import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";

type TimeSlot = {
  hour: number;
  minute: number;
};

type DayAvailability = {
  active: boolean;
  slots: TimeSlot[];
};

type WeekAvailability = {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
};

interface CalendarAvailabilityProps {
  availability: any;
  onChange: (availability: any) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarAvailability = ({ availability, onChange }: CalendarAvailabilityProps) => {
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const toggleDay = (day: string) => {
    onChange({
      ...availability,
      [day]: {
        ...availability[day],
        active: !availability[day].active,
      },
    });
  };

  const updateTime = (day: string, start: string, end: string) => {
    onChange({
      ...availability,
      [day]: {
        ...availability[day],
        start,
        end,
      },
    });
  };

  const applyToAll = () => {
    const updated = { ...availability };
    DAYS.forEach(day => {
      updated[day] = {
        active: true,
        start: startTime,
        end: endTime,
      };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Set Your Availability
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select days and set your available hours
        </p>
      </div>

      {/* Quick Set */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Set Times</Label>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Start</Label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">End</Label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              />
            </div>
            <Button onClick={applyToAll} size="sm">
              Apply to All Days
            </Button>
          </div>
        </div>
      </Card>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, idx) => {
          const isActive = availability[day]?.active;
          const hasTime = availability[day]?.start && availability[day]?.end;
          
          return (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                toggleDay(day);
              }}
              className={cn(
                "p-3 rounded-lg border-2 transition-all text-center",
                "hover:border-primary/50",
                isActive
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              )}
            >
              <div className="text-xs font-semibold mb-1">{DAY_LABELS[idx]}</div>
              {isActive && hasTime && (
                <div className="text-xs text-muted-foreground mt-1">
                  <div>{availability[day].start}</div>
                  <div className="text-[10px]">-</div>
                  <div>{availability[day].end}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Detail */}
      {availability[selectedDay]?.active && (
        <Card className="p-4 border-primary/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base capitalize font-semibold">
                {selectedDay}
              </Label>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Start Time</Label>
                <input
                  type="time"
                  value={availability[selectedDay].start || "09:00"}
                  onChange={(e) =>
                    updateTime(
                      selectedDay,
                      e.target.value,
                      availability[selectedDay].end || "17:00"
                    )
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">End Time</Label>
                <input
                  type="time"
                  value={availability[selectedDay].end || "17:00"}
                  onChange={(e) =>
                    updateTime(
                      selectedDay,
                      availability[selectedDay].start || "09:00",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

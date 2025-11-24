import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

type DayAvailability = {
  active: boolean;
  start: string;
  end: string;
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

interface AvailabilitySchedulerProps {
  availability: WeekAvailability;
  onChange: (availability: WeekAvailability) => void;
}

const DAY_ORDER: Array<keyof WeekAvailability> = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

export const AvailabilityScheduler = ({ availability, onChange }: AvailabilitySchedulerProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Set Your Availability</h3>
        <p className="text-sm text-muted-foreground">
          Choose the days and times you're available to meet
        </p>
      </div>

      {DAY_ORDER.map((day) => (
        <div key={day} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={day} className="text-base capitalize">
              {day}
            </Label>
            <Switch
              id={day}
              checked={availability[day].active}
              onCheckedChange={(checked) =>
                onChange({
                  ...availability,
                  [day]: { ...availability[day], active: checked },
                })
              }
            />
          </div>

          {availability[day].active && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor={`${day}-start`} className="text-sm">
                  Start Time
                </Label>
                <Input
                  id={`${day}-start`}
                  type="time"
                  value={availability[day].start}
                  onChange={(e) =>
                    onChange({
                      ...availability,
                      [day]: { ...availability[day], start: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${day}-end`} className="text-sm">
                  End Time
                </Label>
                <Input
                  id={`${day}-end`}
                  type="time"
                  value={availability[day].end}
                  onChange={(e) =>
                    onChange({
                      ...availability,
                      [day]: { ...availability[day], end: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateSlot {
  date: Date;
  start: string;
  end: string;
}

interface DateSpecificAvailabilityProps {
  dateSlots: DateSlot[];
  onChange: (slots: DateSlot[]) => void;
}

export const DateSpecificAvailability = ({ dateSlots, onChange }: DateSpecificAvailabilityProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const addDateSlot = () => {
    if (!selectedDate) return;
    
    const newSlot: DateSlot = {
      date: selectedDate,
      start: startTime,
      end: endTime,
    };
    
    onChange([...dateSlots, newSlot]);
    setSelectedDate(undefined);
    setStartTime("09:00");
    setEndTime("17:00");
  };

  const removeSlot = (index: number) => {
    onChange(dateSlots.filter((_, i) => i !== index));
  };

  const sortedSlots = [...dateSlots].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Specific Dates
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add availability for specific dates
        </p>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
            </div>

            <Button 
              onClick={addDateSlot} 
              disabled={!selectedDate}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Date
            </Button>
          </div>
        </div>
      </Card>

      {sortedSlots.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Scheduled Dates</Label>
          <div className="space-y-2">
            {sortedSlots.map((slot, index) => (
              <Card key={index} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {format(slot.date, "EEEE, MMMM d, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {slot.start} - {slot.end}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSlot(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

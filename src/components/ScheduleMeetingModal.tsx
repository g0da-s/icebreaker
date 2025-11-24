import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";

type TimeSlot = {
  day: string;
  date: Date;
  startTime: string;
  endTime: string;
  displayTime: string;
};

type DayAvailability = {
  active: boolean;
  start: string;
  end: string;
};

type WeekAvailability = {
  [key: string]: DayAvailability;
};

interface ScheduleMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientAvailability: WeekAvailability | null;
}

export const ScheduleMeetingModal = ({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvailability,
}: ScheduleMeetingModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentUserAvailability, setCurrentUserAvailability] = useState<WeekAvailability | null>(null);
  const [overlappingSlots, setOverlappingSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const fetchCurrentUserAvailability = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('availability')
        .eq('id', session.user.id)
        .single();

      if (!error && data?.availability) {
        setCurrentUserAvailability(data.availability as WeekAvailability);
      }
    };

    if (open) {
      fetchCurrentUserAvailability();
    }
  }, [open]);

  useEffect(() => {
    if (currentUserAvailability && recipientAvailability) {
      const slots = calculateOverlappingSlots(currentUserAvailability, recipientAvailability);
      setOverlappingSlots(slots);
    }
  }, [currentUserAvailability, recipientAvailability]);

  const calculateOverlappingSlots = (
    userAvail: WeekAvailability,
    recipientAvail: WeekAvailability
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });

    daysOfWeek.forEach((day, index) => {
      const userDay = userAvail[day];
      const recipientDay = recipientAvail[day];

      if (userDay?.active && recipientDay?.active) {
        const userStart = timeToMinutes(userDay.start);
        const userEnd = timeToMinutes(userDay.end);
        const recipientStart = timeToMinutes(recipientDay.start);
        const recipientEnd = timeToMinutes(recipientDay.end);

        const overlapStart = Math.max(userStart, recipientStart);
        const overlapEnd = Math.min(userEnd, recipientEnd);

        if (overlapEnd - overlapStart >= 60) {
          const date = addDays(startOfThisWeek, index);
          
          for (let time = overlapStart; time + 60 <= overlapEnd; time += 60) {
            if (slots.length >= 3) break;
            
            const startTimeStr = minutesToTime(time);
            const endTimeStr = minutesToTime(time + 60);
            
            slots.push({
              day: day.charAt(0).toUpperCase() + day.slice(1),
              date: date,
              startTime: startTimeStr,
              endTime: endTimeStr,
              displayTime: `${format(date, 'EEE, MMM d')} at ${startTimeStr}`,
            });
          }
        }
      }

      if (slots.length >= 3) return;
    });

    return slots.slice(0, 3);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleScheduleMeeting = async (slot: TimeSlot) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to schedule meetings",
          variant: "destructive",
        });
        return;
      }

      const scheduledDateTime = new Date(slot.date);
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const { error } = await supabase.from('meetings').insert({
        requester_id: session.user.id,
        recipient_id: recipientId,
        scheduled_at: scheduledDateTime.toISOString(),
        meeting_type: 'friendly',
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent!",
        description: `Meeting request sent to ${recipientName}`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Meeting with {recipientName}</DialogTitle>
          <DialogDescription>
            Select a time slot that works for both of you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {overlappingSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No overlapping availability found.</p>
              <p className="text-sm mt-2">
                Try updating your availability or contact them directly.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Here are the best time slots based on your mutual availability:
              </p>
              {overlappingSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 px-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleScheduleMeeting(slot)}
                  disabled={loading}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className="px-2 py-1">
                        {slot.day}
                      </Badge>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{format(slot.date, 'MMMM d, yyyy')}</div>
                      <div className="text-sm opacity-80 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

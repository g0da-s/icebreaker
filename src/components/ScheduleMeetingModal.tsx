import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, X } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";
import * as DialogPrimitive from "@radix-ui/react-dialog";

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
  meetingId?: string; // Optional: if provided, this is a reschedule operation
}

export const ScheduleMeetingModal = ({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvailability,
  meetingId,
}: ScheduleMeetingModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
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
    const fetchAISuggestions = async () => {
      if (!currentUserAvailability || !recipientAvailability) return;
      
      setLoadingSlots(true);
      try {
        const { data, error } = await supabase.functions.invoke('suggest-meeting-times', {
          body: {
            requesterAvailability: currentUserAvailability,
            recipientAvailability: recipientAvailability,
          }
        });

        if (error) throw error;

        if (data?.suggestions && data.suggestions.length > 0) {
          // Convert AI suggestions to TimeSlot format
          const aiSlots: TimeSlot[] = data.suggestions.map((s: any) => ({
            day: s.day.charAt(0).toUpperCase() + s.day.slice(1),
            date: new Date(s.date),
            startTime: s.startTime,
            endTime: s.endTime,
            displayTime: s.reason,
          }));
          setOverlappingSlots(aiSlots);
        } else {
          // Fallback to basic calculation if AI fails
          const slots = calculateOverlappingSlots(currentUserAvailability, recipientAvailability);
          setOverlappingSlots(slots);
        }
      } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        // Fallback to basic calculation
        const slots = calculateOverlappingSlots(currentUserAvailability, recipientAvailability);
        setOverlappingSlots(slots);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAISuggestions();
  }, [currentUserAvailability, recipientAvailability]);

  const calculateOverlappingSlots = (
    userAvail: WeekAvailability,
    recipientAvail: WeekAvailability
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate slots for the next 14 days to ensure we have enough future slots
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = addDays(today, dayOffset);
      const dayName = daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1];
      
      const userDay = userAvail[dayName];
      const recipientDay = recipientAvail[dayName];

      if (userDay?.active && recipientDay?.active) {
        const userStart = timeToMinutes(userDay.start);
        const userEnd = timeToMinutes(userDay.end);
        const recipientStart = timeToMinutes(recipientDay.start);
        const recipientEnd = timeToMinutes(recipientDay.end);

        const overlapStart = Math.max(userStart, recipientStart);
        const overlapEnd = Math.min(userEnd, recipientEnd);

        if (overlapEnd - overlapStart >= 60) {
          for (let time = overlapStart; time + 60 <= overlapEnd; time += 60) {
            if (slots.length >= 8) break;
            
            const startTimeStr = minutesToTime(time);
            const endTimeStr = minutesToTime(time + 60);
            
            // Create the slot date-time
            const slotDateTime = new Date(date);
            const [hours, minutes] = startTimeStr.split(':').map(Number);
            slotDateTime.setHours(hours, minutes, 0, 0);
            
            // Only include future slots (must be at least 1 minute in the future)
            if (slotDateTime > now) {
              slots.push({
                day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                date: date,
                startTime: startTimeStr,
                endTime: endTimeStr,
                displayTime: `${format(date, 'EEE, MMM d')} at ${startTimeStr}`,
              });
            }
          }
        }
      }

      if (slots.length >= 8) break;
    }

    return slots.slice(0, 8);
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

      // PHASE 1: Check for existing pending invitation (skip if rescheduling)
      if (!meetingId) {
        const { data: existingMeetings, error: checkError } = await supabase
          .from('meetings')
          .select('*')
          .or(`and(requester_id.eq.${session.user.id},recipient_id.eq.${recipientId},status.eq.pending),and(requester_id.eq.${recipientId},recipient_id.eq.${session.user.id},status.eq.pending)`);

        if (checkError) throw checkError;

        if (existingMeetings && existingMeetings.length > 0) {
          toast({
            title: "Already Pending",
            description: "You already have a pending invitation with this user.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const scheduledDateTime = new Date(slot.date);
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      if (meetingId) {
        // RESCHEDULE LOGIC (Ping-Pong Flow):
        // - Update the existing meeting with new time
        // - Set status to 'pending' so the OTHER PARTY must confirm
        // - The proposer is automatically considered "ready" for this new time
        // - The recipient will see this in their "Requests" tab with "Reschedule Proposed" badge
        // - This allows unlimited back-and-forth rescheduling
        const { error } = await supabase
          .from('meetings')
          .update({
            scheduled_at: scheduledDateTime.toISOString(),
            status: 'pending',
          })
          .eq('id', meetingId);

        if (error) throw error;

        toast({
          title: "Reschedule Proposed!",
          description: `New time sent to ${recipientName} for confirmation.`,
        });
      } else {
        // NEW MEETING: Create new meeting
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
      }
      
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
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-md bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]">
          <LiquidCrystalCard className="w-full animate-scale-in">
            <DialogClose className="absolute right-4 top-4 z-50 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-4 w-4 text-white hover:text-destructive transition-colors" />
              <span className="sr-only">Close</span>
            </DialogClose>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {meetingId ? `Reschedule Meeting` : `Schedule Meeting`}
                </h2>
                <p className="text-sm text-slate-300">
                  with {recipientName}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {meetingId 
                    ? 'Select a new time slot. Your partner will need to confirm the new time.' 
                    : 'Select a time slot that works for both of you'}
                </p>
              </div>

              <div className="space-y-3">
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse space-y-3">
                      <div className="h-16 bg-white/10 rounded-full"></div>
                      <div className="h-16 bg-white/10 rounded-full"></div>
                      <div className="h-16 bg-white/10 rounded-full"></div>
                    </div>
                    <p className="text-sm mt-4 text-slate-300">AI is finding the best meeting times...</p>
                  </div>
                ) : overlappingSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50 text-white" />
                    <p className="font-medium text-white">No more slots available today</p>
                    <p className="text-sm mt-2 text-slate-300">
                      Please choose another date or contact them directly.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-300 mb-4 text-center">
                      AI-suggested meeting times based on your mutual availability
                    </p>
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                      {overlappingSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start h-auto py-4 px-4 rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all"
                          onClick={() => handleScheduleMeeting(slot)}
                          disabled={loading}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex-shrink-0">
                              <Badge variant="secondary" className="px-2 py-1 rounded-full bg-white/10 text-white border-white/20">
                                {slot.day}
                              </Badge>
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-white">{format(slot.date, 'MMMM d, yyyy')}</div>
                              <div className="text-sm text-slate-300 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {slot.startTime} - {slot.endTime}
                              </div>
                              {slot.displayTime && (
                                <div className="text-xs text-slate-400 mt-1">
                                  {slot.displayTime}
                                </div>
                              )}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </LiquidCrystalCard>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

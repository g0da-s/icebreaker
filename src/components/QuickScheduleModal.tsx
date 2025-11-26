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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Sparkles, X } from "lucide-react";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface QuickScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
}

export const QuickScheduleModal = ({
  open,
  onOpenChange,
  recipientId,
  recipientName,
}: QuickScheduleModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState("");
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  
  const fullPlaceholder = "Type your preferred time...";

  useEffect(() => {
    if (open) {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullPlaceholder.length) {
          setTypedPlaceholder(fullPlaceholder.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 50);

      return () => clearInterval(typingInterval);
    } else {
      setTypedPlaceholder("");
    }
  }, [open]);

  const handleQuickSchedule = async () => {
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

      // PHASE 1: Check for existing pending invitation
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

      // Fetch both users' availability
      const [requesterResult, recipientResult] = await Promise.all([
        supabase.from('profiles').select('availability').eq('id', session.user.id).single(),
        supabase.from('public_profiles').select('availability').eq('id', recipientId).single(),
      ]);

      if (requesterResult.error || recipientResult.error) {
        throw new Error("Failed to fetch availability");
      }

      // Get AI suggestions
      const { data, error } = await supabase.functions.invoke('suggest-meeting-times', {
        body: {
          requesterAvailability: requesterResult.data.availability,
          recipientAvailability: recipientResult.data.availability,
          preferredTimes: preferences,
        }
      });

      if (error) throw error;

      if (data?.suggestions && data.suggestions.length > 0) {
        // Use the first suggestion
        const bestSlot = data.suggestions[0];
        const scheduledDateTime = new Date(bestSlot.date);
        const [hours, minutes] = bestSlot.startTime.split(':').map(Number);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        const { error: insertError } = await supabase.from('meetings').insert({
          requester_id: session.user.id,
          recipient_id: recipientId,
          scheduled_at: scheduledDateTime.toISOString(),
          meeting_type: 'friendly',
          status: 'pending',
        });

        if (insertError) throw insertError;

        toast({
          title: "Meeting Requested!",
          description: `AI suggested ${bestSlot.reason}. Request sent to ${recipientName}.`,
        });
        
        onOpenChange(false);
      } else {
        toast({
          title: "No Available Times",
          description: "No mutual availability found. Try viewing their full profile.",
          variant: "destructive",
        });
      }
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
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Quick Schedule
                  </h2>
                </div>
                <p className="text-sm text-slate-300">
                  with {recipientName}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  AI will find the best meeting time based on your mutual availability
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preferences" className="text-white text-sm">
                    Any preferences? (optional)
                  </Label>
                  <Input
                    id="preferences"
                    placeholder={typedPlaceholder}
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    className="rounded-full bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  />
                </div>

                <Button
                  className="w-full h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/20"
                  onClick={handleQuickSchedule}
                  disabled={loading}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {loading ? "Finding Best Time..." : "Let AI Schedule"}
                </Button>

                <p className="text-xs text-slate-400 text-center">
                  You'll receive a notification once {recipientName} confirms
                </p>
              </div>
            </div>
          </LiquidCrystalCard>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

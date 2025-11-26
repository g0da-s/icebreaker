import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Sparkles } from "lucide-react";

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Schedule with {recipientName}
          </DialogTitle>
          <DialogDescription>
            AI will find the best meeting time based on your mutual availability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="preferences">
              Any preferences? (optional)
            </Label>
            <Input
              id="preferences"
              placeholder="e.g., 'mornings preferred' or 'weekdays only'"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>

          <Button
            className="w-full h-12"
            onClick={handleQuickSchedule}
            disabled={loading}
          >
            <Calendar className="w-5 h-5 mr-2" />
            {loading ? "Finding Best Time..." : "Let AI Schedule"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You'll receive a notification once {recipientName} confirms
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

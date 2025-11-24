import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { ScheduleMeetingModal } from "@/components/ScheduleMeetingModal";

type Meeting = {
  id: string;
  requester_id: string;
  recipient_id: string;
  scheduled_at: string;
  status: string;
  meeting_type: string;
  created_at: string;
  requester: {
    full_name: string;
    avatar_url: string | null;
    avatar_type: string | null;
    availability: any;
  };
};

const Invitations = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Meeting[]>([]);
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean;
    requesterId: string;
    requesterName: string;
    requesterAvailability: any;
    meetingId: string;
  }>({
    open: false,
    requesterId: '',
    requesterName: '',
    requesterAvailability: null,
    meetingId: '',
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('recipient_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (meetingsError) throw meetingsError;

      if (!meetings || meetings.length === 0) {
        setInvitations([]);
        return;
      }

      // Fetch requester profiles separately
      const requesterIds = meetings.map(m => m.requester_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, avatar_type, availability')
        .in('id', requesterIds);

      if (profilesError) throw profilesError;

      // Combine meetings with requester data
      const enrichedMeetings = meetings.map(meeting => {
        const requester = profiles?.find(p => p.id === meeting.requester_id);
        return {
          ...meeting,
          requester: requester || {
            full_name: 'Unknown',
            avatar_url: null,
            avatar_type: null,
            availability: null,
          }
        };
      });

      setInvitations(enrichedMeetings);
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

  const handleConfirm = async (meetingId: string, requesterName: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status: 'confirmed' })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Meeting Confirmed!",
        description: `Your meeting with ${requesterName} has been confirmed.`,
      });

      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (meetingId: string, requesterName: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status: 'declined' })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Meeting Declined",
        description: `You declined the meeting with ${requesterName}.`,
      });

      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleProposeNewTime = (meeting: Meeting) => {
    setRescheduleModal({
      open: true,
      requesterId: meeting.requester_id,
      requesterName: meeting.requester.full_name,
      requesterAvailability: meeting.requester.availability,
      meetingId: meeting.id,
    });
  };

  const handleReschedule = async (newTime: Date) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          scheduled_at: newTime.toISOString(),
          status: 'reschedule_requested',
        })
        .eq('id', rescheduleModal.meetingId);

      if (error) throw error;

      toast({
        title: "New Time Proposed",
        description: "Your new time suggestion has been sent.",
      });

      setRescheduleModal({ open: false, requesterId: '', requesterName: '', requesterAvailability: null, meetingId: '' });
      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading invitations...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-screen-sm mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Meeting Invitations</h1>

        {invitations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No pending invitations. When someone wants to meet with you, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={invitation.requester.avatar_type === 'upload' ? invitation.requester.avatar_url || undefined : undefined}
                      alt={invitation.requester.full_name}
                    />
                    <AvatarFallback>
                      {invitation.requester.avatar_type === 'mascot' 
                        ? '🧊' 
                        : invitation.requester.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {invitation.requester.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      wants to meet with you
                    </p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(invitation.scheduled_at), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 ml-6">
                    {format(new Date(invitation.scheduled_at), 'h:mm a')}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(invitation.id, invitation.requester.full_name)}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleProposeNewTime(invitation)}
                    className="flex-1"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Propose New Time
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDecline(invitation.id, invitation.requester.full_name)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ScheduleMeetingModal
        open={rescheduleModal.open}
        onOpenChange={(open) => setRescheduleModal({ ...rescheduleModal, open })}
        recipientId={rescheduleModal.requesterId}
        recipientName={rescheduleModal.requesterName}
        recipientAvailability={rescheduleModal.requesterAvailability}
      />

      <BottomNav />
    </div>
  );
};

export default Invitations;

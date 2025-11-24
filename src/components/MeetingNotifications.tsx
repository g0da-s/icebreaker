import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  meeting_id: string;
  requester_name: string;
  created_at: string;
};

export const MeetingNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const checkForCancelledMeetings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get meetings where user is requester and status is cancelled
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, recipient_id, scheduled_at, created_at, updated_at')
        .eq('requester_id', session.user.id)
        .eq('status', 'cancelled')
        .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (meetings && meetings.length > 0) {
        // Get recipient names
        const recipientIds = meetings.map(m => m.recipient_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', recipientIds);

        const notifs: Notification[] = meetings.map(meeting => {
          const profile = profiles?.find(p => p.id === meeting.recipient_id);
          return {
            id: meeting.id,
            meeting_id: meeting.id,
            requester_name: profile?.full_name || 'Someone',
            created_at: meeting.updated_at,
          };
        });

        setNotifications(notifs);

        // Show toast for new cancelled meetings
        if (notifs.length > 0) {
          toast({
            title: "Meeting Declined",
            description: `${notifs[0].requester_name} is unfortunately not available for the meeting.`,
            variant: "destructive",
          });
        }
      }
    };

    checkForCancelledMeetings();

    // Check every minute
    const interval = setInterval(checkForCancelledMeetings, 60000);

    return () => clearInterval(interval);
  }, [toast]);

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notif) => (
        <Card key={notif.id} className="p-4 shadow-lg border-destructive">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive">Meeting Declined</Badge>
              </div>
              <p className="text-sm text-foreground">
                {notif.requester_name} is unfortunately not available for your meeting request.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => dismissNotification(notif.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

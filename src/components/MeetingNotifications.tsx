import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInMinutes, format } from "date-fns";
import { formatDisplayName } from "@/lib/utils";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";

type Notification = {
  id: string;
  meeting_id: string;
  type: "cancelled" | "confirmed" | "reminder";
  other_user_name: string;
  scheduled_at?: string;
  created_at: string;
};

export const MeetingNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('shownNotifications');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [lastCheckTime, setLastCheckTime] = useState<string>(() => {
    return localStorage.getItem('lastNotificationCheck') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  });

  useEffect(() => {
    const checkForNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const now = new Date();
      const newNotifs: Notification[] = [];

      // Check for cancelled meetings (only those cancelled after last check)
      const { data: cancelledMeetings } = await supabase
        .from('meetings')
        .select('id, recipient_id, scheduled_at, created_at, updated_at')
        .eq('requester_id', session.user.id)
        .eq('status', 'cancelled')
        .gt('updated_at', lastCheckTime);

      if (cancelledMeetings && cancelledMeetings.length > 0) {
        const recipientIds = cancelledMeetings.map(m => m.recipient_id);
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, full_name')
          .in('id', recipientIds);

        cancelledMeetings.forEach(meeting => {
          const notifId = `cancelled-${meeting.id}`;
          if (!shownNotifications.has(notifId)) {
            const profile = profiles?.find(p => p.id === meeting.recipient_id);
            newNotifs.push({
              id: notifId,
              meeting_id: meeting.id,
              type: "cancelled",
              other_user_name: formatDisplayName(profile?.full_name) || 'Someone',
              created_at: meeting.updated_at,
            });
          }
        });
      }

      // Check for confirmed meetings
      const { data: confirmedMeetings } = await supabase
        .from('meetings')
        .select('id, requester_id, recipient_id, scheduled_at, updated_at')
        .or(`requester_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .eq('status', 'confirmed')
        .gt('updated_at', new Date(now.getTime() - 5 * 60 * 1000).toISOString());

      if (confirmedMeetings && confirmedMeetings.length > 0) {
        const userIds = new Set<string>();
        confirmedMeetings.forEach(m => {
          if (m.requester_id !== session.user.id) userIds.add(m.requester_id);
          if (m.recipient_id !== session.user.id) userIds.add(m.recipient_id);
        });

        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds));

        confirmedMeetings.forEach(meeting => {
          const notifId = `confirmed-${meeting.id}`;
          if (!shownNotifications.has(notifId)) {
            const otherUserId = meeting.requester_id === session.user.id ? meeting.recipient_id : meeting.requester_id;
            const profile = profiles?.find(p => p.id === otherUserId);
            newNotifs.push({
              id: notifId,
              meeting_id: meeting.id,
              type: "confirmed",
              other_user_name: formatDisplayName(profile?.full_name) || 'Someone',
              scheduled_at: meeting.scheduled_at,
              created_at: meeting.updated_at,
            });
          }
        });
      }

      // Check for upcoming meetings (1 hour before)
      const { data: upcomingMeetings } = await supabase
        .from('meetings')
        .select('id, requester_id, recipient_id, scheduled_at')
        .or(`requester_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .eq('status', 'confirmed')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', new Date(now.getTime() + 70 * 60 * 1000).toISOString());

      if (upcomingMeetings && upcomingMeetings.length > 0) {
        const userIds = new Set<string>();
        upcomingMeetings.forEach(m => {
          if (m.requester_id !== session.user.id) userIds.add(m.requester_id);
          if (m.recipient_id !== session.user.id) userIds.add(m.recipient_id);
        });

        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds));

        upcomingMeetings.forEach(meeting => {
          const minutesUntil = differenceInMinutes(new Date(meeting.scheduled_at), now);
          if (minutesUntil <= 60 && minutesUntil > 50) {
            const notifId = `reminder-${meeting.id}`;
            if (!shownNotifications.has(notifId)) {
              const otherUserId = meeting.requester_id === session.user.id ? meeting.recipient_id : meeting.requester_id;
              const profile = profiles?.find(p => p.id === otherUserId);
              newNotifs.push({
                id: notifId,
                meeting_id: meeting.id,
                type: "reminder",
                other_user_name: formatDisplayName(profile?.full_name) || 'Someone',
                scheduled_at: meeting.scheduled_at,
                created_at: new Date().toISOString(),
              });
            }
          }
        });
      }

      // Show toasts for new notifications
      newNotifs.forEach(notif => {
        if (notif.type === "cancelled") {
          toast({
            title: "Meeting Declined",
            description: `${notif.other_user_name} is not available`,
            variant: "destructive",
            duration: 2000,
          });
        } else if (notif.type === "reminder") {
          toast({
            title: "Meeting Starting Soon!",
            description: `Your meeting with ${notif.other_user_name} starts in 1 hour. Are you still going?`,
          });
        }
        // Confirmed meetings only show in the glassy notification card
      });

      // Only add non-cancelled notifications to the visible list
      const visibleNotifs = newNotifs.filter(n => n.type !== "cancelled");
      if (visibleNotifs.length > 0) {
        setNotifications(prev => [...visibleNotifs, ...prev]);
      }
      
      if (newNotifs.length > 0) {
        setShownNotifications(prev => {
          const newSet = new Set(prev);
          newNotifs.forEach(n => newSet.add(n.id));
          localStorage.setItem('shownNotifications', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
      }
      
      // Update last check time
      const newCheckTime = now.toISOString();
      setLastCheckTime(newCheckTime);
      localStorage.setItem('lastNotificationCheck', newCheckTime);
    };

    checkForNotifications();
    const interval = setInterval(checkForNotifications, 30000);

    return () => clearInterval(interval);
  }, [toast, shownNotifications, lastCheckTime]);

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notif) => (
        <LiquidCrystalCard key={notif.id} className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex-1 text-center">
              {notif.type === "confirmed" ? (
                <div className="space-y-1">
                  <Badge className="mb-2 bg-cyan-500/20 text-cyan-300 border-cyan-400/30">
                    Meeting Confirmed
                  </Badge>
                  <p className="text-base text-white/90">
                    with {notif.other_user_name}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <Bell className={`h-5 w-5 ${
                      notif.type === "cancelled" ? "text-red-400" : "text-amber-400"
                    }`} />
                    <Badge variant={
                      notif.type === "cancelled" ? "destructive" : "secondary"
                    } className="bg-white/10 text-white border-white/20">
                      {notif.type === "cancelled" ? "Meeting Declined" : "Reminder"}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/80">
                    {notif.type === "cancelled" && 
                      `${notif.other_user_name} is unfortunately not available for your meeting request.`}
                    {notif.type === "reminder" && 
                      `Your meeting with ${notif.other_user_name} starts in 1 hour!`}
                  </p>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => dismissNotification(notif.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </LiquidCrystalCard>
      ))}
    </div>
  );
};

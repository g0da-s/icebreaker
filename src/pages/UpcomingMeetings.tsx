import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";

type Meeting = {
  id: string;
  requester_id: string;
  recipient_id: string;
  scheduled_at: string;
  status: string;
  meeting_type: string;
  otherUser: {
    full_name: string;
    avatar_url: string | null;
    avatar_type: string | null;
  };
  isRequester: boolean;
};

const UpcomingMeetings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch meetings where user is either requester or recipient and status is confirmed
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .or(`requester_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .eq('status', 'confirmed')
        .order('scheduled_at', { ascending: true });

      if (meetingsError) throw meetingsError;

      if (!meetingsData || meetingsData.length === 0) {
        setMeetings([]);
        return;
      }

      // Get all unique user IDs
      const userIds = new Set<string>();
      meetingsData.forEach(meeting => {
        if (meeting.requester_id !== session.user.id) {
          userIds.add(meeting.requester_id);
        }
        if (meeting.recipient_id !== session.user.id) {
          userIds.add(meeting.recipient_id);
        }
      });

      // Fetch all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, avatar_type')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      // Combine meetings with other user data
      const enrichedMeetings = meetingsData.map(meeting => {
        const isRequester = meeting.requester_id === session.user.id;
        const otherUserId = isRequester ? meeting.recipient_id : meeting.requester_id;
        const otherUser = profiles?.find(p => p.id === otherUserId);

        return {
          ...meeting,
          otherUser: otherUser || {
            full_name: 'Unknown',
            avatar_url: null,
            avatar_type: null,
          },
          isRequester,
        };
      });

      setMeetings(enrichedMeetings);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading meetings...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-screen-sm mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Upcoming Meetings</h1>

        {meetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No upcoming meetings. Schedule a meeting to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={meeting.otherUser.avatar_type === 'upload' ? meeting.otherUser.avatar_url || undefined : undefined}
                      alt={meeting.otherUser.full_name}
                    />
                    <AvatarFallback>
                      {meeting.otherUser.avatar_type === 'mascot' 
                        ? '🧊' 
                        : meeting.otherUser.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {meeting.otherUser.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {meeting.meeting_type}
                    </p>
                  </div>
                  <Badge variant="default">Confirmed</Badge>
                </div>

                <div className="bg-primary/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                    <Clock className="w-4 h-4" />
                    {format(new Date(meeting.scheduled_at), 'h:mm a')}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default UpcomingMeetings;

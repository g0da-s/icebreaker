import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Check, X, Clock, User, Inbox, CalendarDays, History as HistoryIcon } from "lucide-react";
import { format, isPast } from "date-fns";
import { ScheduleMeetingModal } from "@/components/ScheduleMeetingModal";
import { MeetingNotifications } from "@/components/MeetingNotifications";
import { MeetingCountdown } from "@/components/MeetingCountdown";
import { Clock as ClockComponent } from "@/components/Clock";
import { formatDisplayName } from "@/lib/utils";

type Meeting = {
  id: string;
  requester_id: string;
  recipient_id: string;
  scheduled_at: string;
  status: string;
  meeting_type: string;
  created_at: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    avatar_type: string | null;
    availability?: any;
  };
  isRequester: boolean;
};

const Meetings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState<Meeting[]>([]);
  const [sentRequests, setSentRequests] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [historyMeetings, setHistoryMeetings] = useState<Meeting[]>([]);
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean;
    recipientId: string;
    recipientName: string;
    recipientAvailability: any;
    meetingId: string;
  }>({
    open: false,
    recipientId: '',
    recipientName: '',
    recipientAvailability: null,
    meetingId: '',
  });

  useEffect(() => {
    fetchAllMeetings();
  }, []);

  const fetchAllMeetings = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch all meetings where user is involved
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .or(`requester_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

      if (meetingsError) throw meetingsError;

      if (!meetingsData || meetingsData.length === 0) {
        setIncomingRequests([]);
        setSentRequests([]);
        setUpcomingMeetings([]);
        setHistoryMeetings([]);
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
        .select('id, full_name, avatar_url, avatar_type, availability')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      // Categorize meetings
      const incoming: Meeting[] = [];
      const sent: Meeting[] = [];
      const upcoming: Meeting[] = [];
      const history: Meeting[] = [];
      const now = new Date();

      meetingsData.forEach(meeting => {
        const isRequester = meeting.requester_id === session.user.id;
        const otherUserId = isRequester ? meeting.recipient_id : meeting.requester_id;
        const otherUser = profiles?.find(p => p.id === otherUserId);

        const enrichedMeeting: Meeting = {
          ...meeting,
          otherUser: otherUser || {
            id: otherUserId,
            full_name: 'Unknown',
            avatar_url: null,
            avatar_type: null,
          },
          isRequester,
        };

        const meetingDate = new Date(meeting.scheduled_at);
        const createdDate = new Date(meeting.created_at);
        const isInPast = isPast(meetingDate);
        
        // PHASE 1: Check if invitation is expired (>4 days old)
        const daysSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        const isExpired = daysSinceCreation > 4;

        if (meeting.status === 'pending' && !isExpired) {
          if (isRequester) {
            sent.push(enrichedMeeting);
          } else {
            incoming.push(enrichedMeeting);
          }
        } else if (meeting.status === 'confirmed' && !isInPast) {
          upcoming.push(enrichedMeeting);
        } else if (meeting.status === 'cancelled' || meeting.status === 'completed' || isInPast || (meeting.status === 'pending' && isExpired)) {
          history.push(enrichedMeeting);
        }
      });

      setIncomingRequests(incoming);
      setSentRequests(sent);
      setUpcomingMeetings(upcoming.sort((a, b) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ));
      setHistoryMeetings(history);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get the meeting details
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('requester_id, recipient_id')
        .eq('id', meetingId)
        .single();

      if (meetingError) throw meetingError;

      // Fetch both users' interests
      const [requesterInterests, recipientInterests] = await Promise.all([
        supabase.from('user_interests').select('tags').eq('user_id', meetingData.requester_id).maybeSingle(),
        supabase.from('user_interests').select('tags').eq('user_id', meetingData.recipient_id).maybeSingle(),
      ]);

      const requesterTags = requesterInterests.data?.tags || [];
      const recipientTags = recipientInterests.data?.tags || [];
      const commonInterests = requesterTags.filter((tag: string) => recipientTags.includes(tag));

      // Pick the first common interest or use a default
      const connectedInterest = commonInterests.length > 0 ? commonInterests[0] : 'shared interests';

      // Update meeting status and connected interest
      const { error } = await supabase
        .from('meetings')
        .update({ 
          status: 'confirmed',
          connected_interest: connectedInterest
        })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Meeting Confirmed!",
        description: `Your meeting with ${requesterName} has been confirmed.`,
      });

      fetchAllMeetings();
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
        .update({ status: 'cancelled' })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Meeting Declined",
        description: `You declined the meeting with ${requesterName}.`,
      });

      fetchAllMeetings();
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
      recipientId: meeting.otherUser.id,
      recipientName: formatDisplayName(meeting.otherUser.full_name),
      recipientAvailability: meeting.otherUser.availability,
      meetingId: meeting.id,
    });
  };

  const handleCancelMeeting = async (meetingId: string, otherUserName: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status: 'cancelled' })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Meeting Cancelled",
        description: `Your meeting with ${otherUserName} has been cancelled.`,
      });

      fetchAllMeetings();
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
          <p className="text-center text-muted-foreground">Loading meetings...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClockComponent />
      <MeetingNotifications />
      
      <div className="container max-w-screen-sm mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Meetings</h1>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="requests" className="relative">
              <Inbox className="w-4 h-4 mr-2" />
              Requests
              {incomingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {incomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <CalendarDays className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="history">
              <HistoryIcon className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Incoming Requests</h3>
              {incomingRequests.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No pending requests
                </p>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((meeting) => (
                    <Card key={meeting.id} className="p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={meeting.otherUser.avatar_url || undefined}
                            alt={meeting.otherUser.full_name}
                          />
                          <AvatarFallback>
                            {meeting.otherUser.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {formatDisplayName(meeting.otherUser.full_name)}
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
                            {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d, yyyy')}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 ml-6">
                          {format(new Date(meeting.scheduled_at), 'h:mm a')}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(meeting.id, formatDisplayName(meeting.otherUser.full_name))}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProposeNewTime(meeting)}
                          className="flex-1"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Propose New Time
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDecline(meeting.id, formatDisplayName(meeting.otherUser.full_name))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Sent Requests</h3>
              {sentRequests.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No sent requests
                </p>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((meeting) => (
                    <Card key={meeting.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={meeting.otherUser.avatar_url || undefined}
                            alt={meeting.otherUser.full_name}
                          />
                          <AvatarFallback>
                            {meeting.otherUser.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {formatDisplayName(meeting.otherUser.full_name)}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d')} at {format(new Date(meeting.scheduled_at), 'h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline">Awaiting Response</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No upcoming meetings. Schedule a meeting to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <Card key={meeting.id} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={meeting.otherUser.avatar_url || undefined}
                          alt={meeting.otherUser.full_name}
                        />
                        <AvatarFallback>
                          {meeting.otherUser.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {formatDisplayName(meeting.otherUser.full_name)}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {meeting.meeting_type}
                        </p>
                      </div>
                      <Badge variant="default">Confirmed</Badge>
                    </div>

                    <div className="bg-primary/5 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="font-medium">
                            {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d, yyyy')}
                          </span>
                        </div>
                        <MeetingCountdown scheduledAt={meeting.scheduled_at} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                        <Clock className="w-4 h-4" />
                        {format(new Date(meeting.scheduled_at), 'h:mm a')}
                      </div>
                    </div>

                    {/* Show Ice-Breaker button if within 48 hours of meeting */}
                    {(() => {
                      const now = new Date();
                      const meetingStart = new Date(meeting.scheduled_at);
                      const fortyEightHoursBefore = new Date(meetingStart.getTime() - 48 * 60 * 60 * 1000);
                      const canAccessIceBreaker = now >= fortyEightHoursBefore;
                      
                      return canAccessIceBreaker ? (
                        <Button
                          size="sm"
                          onClick={() => window.location.href = `/meeting/${meeting.id}/ice-breaker`}
                          className="w-full mb-2"
                        >
                          Break the Ice 🧊
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelMeeting(meeting.id, formatDisplayName(meeting.otherUser.full_name))}
                          className="w-full"
                        >
                          Cancel Meeting
                        </Button>
                      );
                    })()}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {historyMeetings.length === 0 ? (
              <div className="text-center py-12">
                <HistoryIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No meeting history yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyMeetings.map((meeting) => (
                  <Card key={meeting.id} className="p-4 opacity-75">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={meeting.otherUser.avatar_url || undefined}
                          alt={meeting.otherUser.full_name}
                        />
                        <AvatarFallback>
                          {meeting.otherUser.avatar_type === 'mascot' 
                            ? '🧊' 
                            : meeting.otherUser.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {formatDisplayName(meeting.otherUser.full_name)}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(meeting.scheduled_at), 'MMMM d, yyyy')} at {format(new Date(meeting.scheduled_at), 'h:mm a')}
                        </p>
                      </div>
                      <Badge variant={meeting.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {meeting.status === 'cancelled' ? 'Cancelled' : meeting.status === 'completed' ? 'Completed' : 'Past'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ScheduleMeetingModal
        open={rescheduleModal.open}
        onOpenChange={(open) => setRescheduleModal({ ...rescheduleModal, open })}
        recipientId={rescheduleModal.recipientId}
        recipientName={rescheduleModal.recipientName}
        recipientAvailability={rescheduleModal.recipientAvailability}
      />

      <BottomNav />
    </div>
  );
};

export default Meetings;

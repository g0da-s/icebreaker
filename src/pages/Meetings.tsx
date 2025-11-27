import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Check, X, Clock, User, Inbox, CalendarDays, History as HistoryIcon } from "lucide-react";
import { format, isPast } from "date-fns";
import { ScheduleMeetingModal } from "@/components/ScheduleMeetingModal";
import { MeetingNotifications } from "@/components/MeetingNotifications";
import { MeetingCountdown } from "@/components/MeetingCountdown";
import { formatDisplayName } from "@/lib/utils";
import { UserProfileModal } from "@/components/UserProfileModal";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";

type Meeting = {
  id: string;
  requester_id: string;
  recipient_id: string;
  scheduled_at: string;
  status: string;
  meeting_type: string;
  created_at: string;
  updated_at: string;
  requester_completed: boolean | null;
  recipient_completed: boolean | null;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    avatar_type: string | null;
    availability?: any;
  };
  isRequester: boolean;
  isReschedule?: boolean;
};

const Meetings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState<Meeting[]>([]);
  const [sentRequests, setSentRequests] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [historyMeetings, setHistoryMeetings] = useState<Meeting[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
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

  const [profileModal, setProfileModal] = useState<{
    open: boolean;
    user: any;
  }>({
    open: false,
    user: null,
  });

  useEffect(() => {
    fetchAllMeetings();
  }, []);

  // Subscribe to meeting completions
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      return session.user.id;
    };

    fetchUserId().then((userId) => {
      if (!userId) return;

      const channel = supabase
        .channel('meetings-completion')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'meetings',
          },
          (payload) => {
            if (payload.new.status === 'completed') {
              const meeting = payload.new as any;
              if (meeting.requester_id === userId || meeting.recipient_id === userId) {
                setShowCelebration(true);
                fetchAllMeetings();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [toast]);

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
        .from('public_profiles')
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
        const updatedDate = new Date(meeting.updated_at);
        const isInPast = isPast(meetingDate);
        
        // PHASE 1: Check if invitation is expired (>4 days old)
        const daysSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        const isExpired = daysSinceCreation > 4;
        
        // Check if this is a reschedule (updated significantly after creation)
        const timeSinceUpdate = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60); // in minutes
        const isReschedule = timeSinceUpdate > 5; // If updated more than 5 mins after creation, it's a reschedule
        enrichedMeeting.isReschedule = isReschedule;

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

      // Pre-select questions for all stages (local logic, no API)
      const stage1Questions = [
        "How has your week been going so far? Anything interesting happen?",
        "If you could teleport anywhere right now for 1 hour, where would you go?",
        "What's a small habit you have that you're proud of?",
        "Coffee, tea, or something else? What fuels your day?"
      ];
      const stage2Questions = [
        "What's the story behind how you got into [interest]?",
        "What part of [interest] energizes you the most right now?",
        "Who has influenced your journey in [interest] the most?",
        "What is the biggest misconception people have about [interest]?"
      ];
      const stage3Questions = [
        "What is a piece of advice you received that completely changed your perspective?",
        "What does 'success' authentically look like to you in 5 years?",
        "If you could solve one major problem in the world, what would it be?",
        "What brings you a sense of purpose outside of work or study?"
      ];

      // Randomly select one question from each stage
      const selectedQ1 = stage1Questions[Math.floor(Math.random() * stage1Questions.length)];
      const selectedQ2 = stage2Questions[Math.floor(Math.random() * stage2Questions.length)].replace('[interest]', connectedInterest);
      const selectedQ3 = stage3Questions[Math.floor(Math.random() * stage3Questions.length)];

      const selectedQuestions = {
        q1: selectedQ1,
        q2: selectedQ2,
        q3: selectedQ3
      };

      // Update meeting status, connected interest, and selected questions
      const { error } = await supabase
        .from('meetings')
        .update({ 
          status: 'confirmed',
          connected_interest: connectedInterest,
          selected_questions: selectedQuestions
        })
        .eq('id', meetingId);

      if (error) throw error;

      // Create Google Calendar events for both users if connected
      const { data: meeting, error: meetingFetchError } = await supabase
        .from('meetings')
        .select('scheduled_at, requester_id, recipient_id')
        .eq('id', meetingId)
        .single();

      if (!meetingFetchError && meeting) {
        const { data: requesterProfile } = await supabase
          .from('profiles')
          .select('google_calendar_connected, email, full_name')
          .eq('id', meeting.requester_id)
          .single();

        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('google_calendar_connected, email, full_name')
          .eq('id', meeting.recipient_id)
          .single();

        const startTime = new Date(meeting.scheduled_at);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour meeting

        // Create calendar event for requester if connected
        if (requesterProfile?.google_calendar_connected) {
          try {
            await supabase.functions.invoke('google-calendar-create-event', {
              body: {
                meetingId: meetingId,
                attendeeEmail: recipientProfile?.email,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                title: `Icebreaker Meeting with ${recipientProfile?.full_name || 'User'}`,
                description: `Meeting scheduled via Icebreaker app. Connected interest: ${connectedInterest}`,
              },
            });
          } catch (err) {
            console.error('Failed to create calendar event for requester:', err);
          }
        }

        // Create calendar event for recipient if connected
        if (recipientProfile?.google_calendar_connected) {
          try {
            await supabase.functions.invoke('google-calendar-create-event', {
              body: {
                meetingId: meetingId,
                attendeeEmail: requesterProfile?.email,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                title: `Icebreaker Meeting with ${requesterProfile?.full_name || 'User'}`,
                description: `Meeting scheduled via Icebreaker app. Connected interest: ${connectedInterest}`,
              },
            });
          } catch (err) {
            console.error('Failed to create calendar event for recipient:', err);
          }
        }
      }

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

      // Only show notification to the person declining (recipient)
      // MeetingNotifications component will handle notifying the requester
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

  const handleViewProfile = async (userId: string) => {
    try {
      // Fetch full user profile including interests
      const [profileResult, interestsResult] = await Promise.all([
        supabase
          .from('public_profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('user_interests')
          .select('tags, bio')
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      if (profileResult.error) throw profileResult.error;

      setProfileModal({
        open: true,
        user: {
          user_id: userId,
          full_name: profileResult.data.full_name || '',
          studies: profileResult.data.studies,
          role: profileResult.data.role,
          avatar_url: profileResult.data.avatar_url,
          avatar_type: profileResult.data.avatar_type,
          tags: interestsResult.data?.tags || [],
          bio: interestsResult.data?.bio || null,
        }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not load user profile",
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
      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 pb-24 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <motion.div 
            animate={{ 
              y: [0, 100, 0],
              rotate: [0, 45, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-cyan-500/20 rounded-full blur-[120px] opacity-40"
          />
          <motion.div 
            animate={{ 
              y: [0, -100, 0],
              rotate: [0, -45, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[30%] -right-[15%] w-[900px] h-[900px] bg-violet-600/20 rounded-full blur-[130px] opacity-40"
          />
          <motion.div 
            animate={{ 
              y: [0, 50, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-700/15 rounded-full blur-[140px] opacity-30"
          />
        </div>

        {/* Logo Header */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-slate-950/50 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="icebreaker.ai Logo" className="h-10 w-10 rounded-lg brightness-75" />
            <div className="text-xl font-bold tracking-tighter text-white">icebreaker.ai</div>
          </Link>
        </nav>

        <div className="relative z-10 container max-w-screen-sm mx-auto px-4 pt-24 pb-6">
          <p className="text-center text-slate-300">Loading meetings...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <>
      {showCelebration && (
        <CelebrationOverlay onComplete={() => {
          setShowCelebration(false);
          navigate("/meetings");
        }} />
      )}
      
      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 pb-24 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            y: [0, 100, 0],
            rotate: [0, 45, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-cyan-500/20 rounded-full blur-[120px] opacity-40"
        />
        <motion.div 
          animate={{ 
            y: [0, -100, 0],
            rotate: [0, -45, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[30%] -right-[15%] w-[900px] h-[900px] bg-violet-600/20 rounded-full blur-[130px] opacity-40"
        />
        <motion.div 
          animate={{ 
            y: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-700/15 rounded-full blur-[140px] opacity-30"
        />
      </div>

      {/* Logo Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-slate-950/50 border-b border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="icebreaker.ai Logo" className="h-10 w-10 rounded-lg brightness-75" />
          <div className="text-xl font-bold tracking-tighter text-white">icebreaker.ai</div>
        </Link>
      </nav>

      <MeetingNotifications />
      
      <div className="relative z-10 container max-w-screen-sm mx-auto px-4 pt-24 pb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-6"
        >
          Meetings
        </motion.h1>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-900/30 backdrop-blur-xl border border-white/20">
            <TabsTrigger value="requests" className="relative data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-300">
              <Inbox className="w-4 h-4 mr-2" />
              Requests
              {incomingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {incomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-300">
              <CalendarDays className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-300">
              <HistoryIcon className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Incoming Requests</h3>
              {incomingRequests.length === 0 ? (
                <p className="text-center py-8 text-slate-300">
                  No pending requests
                </p>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((meeting) => (
                    <LiquidCrystalCard key={meeting.id} className="p-4">
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
                          <h3 
                            className="font-semibold text-white cursor-pointer hover:text-cyan-400 transition-colors"
                            onClick={() => handleViewProfile(meeting.otherUser.id)}
                          >
                            {formatDisplayName(meeting.otherUser.full_name)}
                          </h3>
                          <p className="text-sm text-slate-300 mt-1">
                            wants to meet with you
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-200">
                          {meeting.isReschedule ? 'Reschedule Proposed' : 'Pending'}
                        </Badge>
                      </div>

                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-slate-300" />
                          <span className="font-medium text-white">
                            {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d, yyyy')}
                          </span>
                        </div>
                        <div className="text-sm text-slate-300 mt-1 ml-6">
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
                    </LiquidCrystalCard>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Sent Requests</h3>
              {sentRequests.length === 0 ? (
                <p className="text-center py-8 text-slate-300">
                  No sent requests
                </p>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((meeting) => (
                    <LiquidCrystalCard key={meeting.id} className="p-4">
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
                          <h3 
                            className="font-semibold text-white cursor-pointer hover:text-cyan-400 transition-colors"
                            onClick={() => handleViewProfile(meeting.otherUser.id)}
                          >
                            {formatDisplayName(meeting.otherUser.full_name)}
                          </h3>
                          <p className="text-sm text-slate-300 mt-1">
                            {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d')} at {format(new Date(meeting.scheduled_at), 'h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-slate-300">Awaiting Response</Badge>
                      </div>
                    </LiquidCrystalCard>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-300">
                  No upcoming meetings. Schedule a meeting to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <LiquidCrystalCard key={meeting.id} className="p-4">
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
                        <h3 
                          className="font-semibold text-white flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => handleViewProfile(meeting.otherUser.id)}
                        >
                          <User className="w-4 h-4" />
                          {formatDisplayName(meeting.otherUser.full_name)}
                        </h3>
                        <p className="text-sm text-slate-300 mt-1">
                          {meeting.meeting_type}
                        </p>
                      </div>
                      <Badge variant="default">Confirmed</Badge>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          <span className="font-medium text-white">
                            {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d, yyyy')}
                          </span>
                        </div>
                        <MeetingCountdown scheduledAt={meeting.scheduled_at} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300 ml-6">
                        <Clock className="w-4 h-4" />
                        {format(new Date(meeting.scheduled_at), 'h:mm a')}
                      </div>
                    </div>

                    {/* Show Ice-Breaker button if within 48 hours, always show Cancel */}
                    {(() => {
                      const now = new Date();
                      const meetingStart = new Date(meeting.scheduled_at);
                      const fortyEightHoursBefore = new Date(meetingStart.getTime() - 48 * 60 * 60 * 1000);
                      const canAccessIceBreaker = now >= fortyEightHoursBefore;
                      
                      // Check if current user has completed
                      const currentUserCompleted = meeting.isRequester 
                        ? meeting.requester_completed 
                        : meeting.recipient_completed;
                      const otherUserCompleted = meeting.isRequester 
                        ? meeting.recipient_completed 
                        : meeting.requester_completed;

                      // If current user completed but other hasn't, show waiting status
                      if (currentUserCompleted && !otherUserCompleted) {
                        return (
                          <Badge variant="secondary" className="w-full justify-center py-2">
                            Waiting for partner to finish... ⏳
                          </Badge>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {canAccessIceBreaker && (
                            <Button
                              size="sm"
                              onClick={() => window.location.href = `/meeting/${meeting.id}/ice-breaker`}
                              className="w-full"
                            >
                              Break the Ice 🧊
                            </Button>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // When rescheduling, we need to pass the OTHER user's info
                                // so the reschedule request goes to them for confirmation
                                const otherUserId = meeting.isRequester ? meeting.recipient_id : meeting.requester_id;
                                const otherUser = meeting.otherUser;
                                
                                setRescheduleModal({
                                  open: true,
                                  recipientId: otherUserId,
                                  recipientName: formatDisplayName(otherUser.full_name),
                                  recipientAvailability: otherUser.availability,
                                  meetingId: meeting.id,
                                });
                              }}
                              className="w-full"
                            >
                              Reschedule
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelMeeting(meeting.id, formatDisplayName(meeting.otherUser.full_name))}
                              className="w-full"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </LiquidCrystalCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {historyMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <HistoryIcon className="w-16 h-16 text-slate-400 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-white mb-2">No Meeting History Yet</h3>
                <p className="text-sm text-slate-400 max-w-md">
                  Your past meetings will appear here. Start connecting with others to build your meeting history!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyMeetings.map((meeting) => (
                  <LiquidCrystalCard key={meeting.id} className="p-4 opacity-75">
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
                        <h3 
                          className="font-semibold text-white cursor-pointer hover:text-cyan-400 transition-colors"
                          onClick={() => handleViewProfile(meeting.otherUser.id)}
                        >
                          {formatDisplayName(meeting.otherUser.full_name)}
                        </h3>
                        <p className="text-sm text-slate-300 mt-1">
                          {format(new Date(meeting.scheduled_at), 'MMMM d, yyyy')} at {format(new Date(meeting.scheduled_at), 'h:mm a')}
                        </p>
                      </div>
                      <Badge variant={meeting.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {meeting.status === 'cancelled' ? 'Cancelled' : meeting.status === 'completed' ? 'Completed' : 'Past'}
                      </Badge>
                    </div>
                  </LiquidCrystalCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ScheduleMeetingModal
        open={rescheduleModal.open}
        onOpenChange={(open) => {
          setRescheduleModal({ ...rescheduleModal, open });
          if (!open) {
            // Refresh meetings when modal closes
            fetchAllMeetings();
          }
        }}
        recipientId={rescheduleModal.recipientId}
        recipientName={rescheduleModal.recipientName}
        recipientAvailability={rescheduleModal.recipientAvailability}
        meetingId={rescheduleModal.meetingId}
      />

      {profileModal.user && (
        <UserProfileModal
          open={profileModal.open}
          onOpenChange={(open) => setProfileModal({ ...profileModal, open })}
          user={profileModal.user}
        />
      )}

      <BottomNav />
    </div>
    </>
  );
};

export default Meetings;

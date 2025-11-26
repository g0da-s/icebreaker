import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Sparkles, MessageCircle, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { formatDisplayName } from "@/lib/utils";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";

type Meeting = {
  id: string;
  scheduled_at: string;
  requester_id: string;
  recipient_id: string;
  connected_interest: string | null;
  current_stage: number;
};

type UserProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  avatar_type: string | null;
};

type Stage = 1 | 2 | 3 | 4;

const IceBreaker = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>(1);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [commonTags, setCommonTags] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [waitingForOther, setWaitingForOther] = useState(false);
  const [isRequester, setIsRequester] = useState(false);
  const [currentEndlessTopic, setCurrentEndlessTopic] = useState<string>("Keep the conversation going!");
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchMeetingData();
  }, [id]);

  // Subscribe to real-time stage updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`meeting-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meetings',
          filter: `id=eq.${id}`
        },
        (payload) => {
          const newStage = payload.new.current_stage;
          if (newStage && newStage !== stage) {
            setStage(newStage as Stage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, stage]);

  // Subscribe to meeting completion
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`meeting-completion-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meetings',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.new.status === 'completed') {
            setShowCelebration(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate, toast]);

  const fetchMeetingData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);

      // Fetch meeting
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single();

      if (meetingError) throw meetingError;
      setMeeting(meetingData);

      // Determine if current user is the requester
      setIsRequester(meetingData.requester_id === session.user.id);

      // Set stage from database
      setStage(meetingData.current_stage as Stage);

      // Load pre-selected questions from database
      if (selectedQuestions.length === 0 && meetingData.selected_questions) {
        const questions = meetingData.selected_questions as { q1: string; q2: string; q3: string };
        setSelectedQuestions([questions.q1, questions.q2, questions.q3]);
      }

      // Determine other user
      const otherUserId = meetingData.requester_id === session.user.id 
        ? meetingData.recipient_id 
        : meetingData.requester_id;

      // Fetch other user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('public_profiles')
        .select('id, full_name, avatar_url, avatar_type')
        .eq('id', otherUserId)
        .single();

      if (profileError) throw profileError;
      setOtherUser(profileData);

      // Fetch common interests
      const [currentUserInterests, otherUserInterests] = await Promise.all([
        supabase.from('user_interests').select('tags').eq('user_id', session.user.id).maybeSingle(),
        supabase.from('user_interests').select('tags').eq('user_id', otherUserId).maybeSingle(),
      ]);

      const currentTags = currentUserInterests.data?.tags || [];
      const otherTags = otherUserInterests.data?.tags || [];
      const common = currentTags.filter((tag: string) => otherTags.includes(tag));
      setCommonTags(common);

      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/meetings");
    }
  };

  const endlessTopics = [
    "What is your biggest non-academic dream?",
    "What's the best piece of advice you've ever received?",
    "If you could master any skill instantly, what would it be and why?",
    "What's a belief you held strongly that you've changed your mind about?",
    "What's your favorite memory related to [interest]?",
    "If you could have dinner with anyone (living or dead), who would it be?",
    "What's something you're proud of that most people don't know about?",
    "What does a perfect day look like for you?",
    "What's a risk you took that paid off?",
    "What's something about [interest] that you wish more people understood?",
    "What motivates you to keep going when things get tough?",
    "What's a hobby or interest you've always wanted to explore?",
  ];

  const handleGenerateNewTopic = () => {
    const interest = meeting?.connected_interest || "your interests";
    const randomTopic = endlessTopics[Math.floor(Math.random() * endlessTopics.length)];
    const formattedTopic = randomTopic.replace(/\[interest\]/g, interest);
    setCurrentEndlessTopic(formattedTopic);
  };

  const getQuestion = (): { icon: React.ReactNode; title: string; question: string } => {
    const interest = meeting?.connected_interest || "your interests";
    
    const icons = [
      <Sparkles className="w-6 h-6" />,
      <MessageCircle className="w-6 h-6" />,
      <Target className="w-6 h-6" />
    ];

    const titles = [
      "Introductory",
      "Deepening",
      "Advanced Reflection"
    ];

    const questionTemplate = selectedQuestions[stage - 1] || "";
    const question = questionTemplate.replace(/\[interest\]/g, interest);

    return {
      icon: icons[stage - 1],
      title: titles[stage - 1],
      question: question,
    };
  };

  const handleNext = async () => {
    if (stage < 4) {
      const nextStage = (stage + 1) as Stage;
      
      // Update stage in database for real-time sync
      const { error } = await supabase
        .from('meetings')
        .update({ current_stage: nextStage })
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setStage(nextStage);
    }
  };

  const handleBack = async () => {
    if (stage > 1) {
      const prevStage = (stage - 1) as Stage;
      
      // Update stage in database for real-time sync
      const { error } = await supabase
        .from('meetings')
        .update({ current_stage: prevStage })
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setStage(prevStage);
    }
  };

  const checkAndGrantAchievements = async (userId: string) => {
    try {
      // Count total completed meetings for this user
      const { count } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

      const totalCompleted = count || 0;

      // Define achievement thresholds
      const milestones = [
        { threshold: 1, slug: 'meeting_1', title: 'Ice Cracker' },
        { threshold: 5, slug: 'meeting_5', title: 'Arctic Explorer' },
        { threshold: 15, slug: 'meeting_15', title: 'Glacier Guide' },
        { threshold: 30, slug: 'meeting_30', title: 'Grand Ice Master' },
      ];

      for (const milestone of milestones) {
        if (totalCompleted >= milestone.threshold) {
          // Get achievement definition
          const { data: achievementDef } = await supabase
            .from('achievement_definitions')
            .select('id')
            .eq('slug', milestone.slug)
            .single();

          if (!achievementDef) continue;

          // Check if user already has this achievement
          const { data: existing } = await supabase
            .from('user_achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('achievement_id', achievementDef.id)
            .maybeSingle();

          // Grant achievement if not already owned
          if (!existing) {
            await supabase
              .from('user_achievements')
              .insert({ user_id: userId, achievement_id: achievementDef.id });

            // Only show toast for the current user
            if (userId === currentUserId) {
              toast({
                title: `Achievement Unlocked: ${milestone.title}! 🏆`,
                description: `You've completed ${milestone.threshold} meeting${milestone.threshold > 1 ? 's' : ''}!`,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const handleMarkCompleted = async () => {
    if (!meeting) return;
    
    setIsCompleting(true);
    
    try {
      const columnToUpdate = isRequester ? 'requester_completed' : 'recipient_completed';
      
      // Update the user's completion status
      const { error: updateError } = await supabase
        .from('meetings')
        .update({ [columnToUpdate]: true })
        .eq('id', id);

      if (updateError) throw updateError;

      // Fetch the updated meeting to check both statuses
      const { data: updatedMeeting, error: fetchError } = await supabase
        .from('meetings')
        .select('requester_completed, recipient_completed')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Check if both users have completed
      if (updatedMeeting.requester_completed && updatedMeeting.recipient_completed) {
        // Both completed - mark meeting as completed
        const { error: statusError } = await supabase
          .from('meetings')
          .update({ status: 'completed' })
          .eq('id', id);

        if (statusError) throw statusError;

        // Check and grant achievements for BOTH users
        await checkAndGrantAchievements(meeting.requester_id);
        await checkAndGrantAchievements(meeting.recipient_id);

        setShowCelebration(true);
      } else {
        // Waiting for other user
        setWaitingForOther(true);
        toast({
          title: "Marked as Completed",
          description: "Waiting for the other person to confirm...",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!meeting || !otherUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Meeting not found</p>
      </div>
    );
  }

  const questionData = getQuestion();

  return (
    <>
      {showCelebration && (
        <CelebrationOverlay onComplete={() => navigate("/meetings")} />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={otherUser.avatar_url || undefined}
                alt={otherUser.full_name}
              />
              <AvatarFallback>
                {otherUser.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-2xl">🧊</span>
          </div>
          <div>
            <CardTitle className="text-2xl">Ice Breaker</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Meeting with {formatDisplayName(otherUser.full_name)}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d, h:mm a')}
            </p>
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${
                  s <= stage ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {stage < 4 ? (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {questionData.icon}
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Stage {stage} of 4
                    </Badge>
                    <h3 className="text-lg font-semibold">{questionData.title}</h3>
                  </div>
                </div>
                <p className="text-lg text-foreground leading-relaxed">
                  {questionData.question}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Stage 4 of 4
                    </Badge>
                    <h3 className="text-lg font-semibold">Endless Conversation</h3>
                  </div>
                </div>
                <p className="text-xl text-foreground leading-relaxed font-medium text-center py-8">
                  {currentEndlessTopic}
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleBack} 
                    variant="outline" 
                    size="lg" 
                    className="h-12"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleGenerateNewTopic} 
                    variant="outline" 
                    className="flex-1 h-12"
                    size="lg"
                  >
                    Generate New Topic 🎲
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {meeting?.connected_interest && stage === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Connected Interest:
              </p>
              <Badge variant="default" className="text-base px-4 py-1">
                {meeting.connected_interest}
              </Badge>
            </div>
          )}

          {stage < 4 && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">💡 Tip</p>
              <p className="text-sm text-muted-foreground">
                {stage === 1 && "Start with something you both care about to create common ground."}
                {stage === 2 && "Share your curiosity and be open to their perspective."}
                {stage === 3 && "Think about how you can mutually benefit from this connection."}
              </p>
            </div>
          )}

          {stage < 4 ? (
            <div className="flex gap-3">
              {stage > 1 && (
                <Button 
                  onClick={handleBack} 
                  variant="outline" 
                  size="lg" 
                  className="h-12"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              )}
              
              <Button onClick={handleNext} className="flex-1 h-12" size="lg">
                Next Question
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          ) : waitingForOther ? (
            <div className="space-y-3">
              <Button disabled className="w-full h-12" size="lg">
                Waiting for other person to confirm...
              </Button>
              <Button 
                onClick={() => navigate("/meetings")} 
                variant="outline" 
                className="w-full h-12" 
                size="lg"
              >
                Back to Meetings List
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate("/meetings")} 
                variant="outline" 
                className="flex-1 h-12" 
                size="lg"
              >
                Return to Dashboard
              </Button>
              <Button 
                onClick={handleMarkCompleted} 
                className="flex-1 h-12" 
                size="lg"
                disabled={isCompleting}
              >
                {isCompleting ? "Marking..." : "Finish Meeting"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default IceBreaker;

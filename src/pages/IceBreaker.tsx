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

type Stage = 1 | 2 | 3;

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

      // Generate random questions for this session if not already done
      if (selectedQuestions.length === 0) {
        const stage1Questions = [
          "What's the story behind how you got into [interest]?",
          "What first sparked your interest in [interest]?",
          "Was there a moment when you realized you really enjoyed [interest]?"
        ];
        const stage2Questions = [
          "What part of [interest] energizes you the most right now?",
          "What part of [interest] keeps you coming back to it?",
          "What's something about [interest] that genuinely excites you?"
        ];
        const stage3Questions = [
          "Has anything you're learning or exploring in [interest] surprised you lately?",
          "Have you changed your perspective on [interest] recently?",
          "What's something unexpected you discovered while exploring [interest]?"
        ];

        const randomQ1 = stage1Questions[Math.floor(Math.random() * stage1Questions.length)];
        const randomQ2 = stage2Questions[Math.floor(Math.random() * stage2Questions.length)];
        const randomQ3 = stage3Questions[Math.floor(Math.random() * stage3Questions.length)];
        
        setSelectedQuestions([randomQ1, randomQ2, randomQ3]);
      }

      // Determine other user
      const otherUserId = meetingData.requester_id === session.user.id 
        ? meetingData.recipient_id 
        : meetingData.requester_id;

      // Fetch other user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
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
    if (stage < 3) {
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

        toast({
          title: "Meeting Completed!",
          description: "Thanks for confirming. The meeting has been moved to history.",
        });
        navigate("/meetings");
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
            {[1, 2, 3].map((s) => (
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
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {questionData.icon}
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">
                    Stage {stage} of 3
                  </Badge>
                  <h3 className="text-lg font-semibold">{questionData.title}</h3>
                </div>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                {questionData.question}
              </p>
            </CardContent>
          </Card>

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

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">💡 Tip</p>
            <p className="text-sm text-muted-foreground">
              {stage === 1 && "Start with something you both care about to create common ground."}
              {stage === 2 && "Share your curiosity and be open to their perspective."}
              {stage === 3 && "Think about how you can mutually benefit from this connection."}
            </p>
          </div>

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
            
            {stage < 3 ? (
              <Button onClick={handleNext} className="flex-1 h-12" size="lg">
                Next Question
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : waitingForOther ? (
              <Button disabled className="flex-1 h-12" size="lg">
                Waiting for other person to confirm...
              </Button>
            ) : (
              <Button 
                onClick={handleMarkCompleted} 
                className="flex-1 h-12" 
                size="lg"
                disabled={isCompleting}
              >
                {isCompleting ? "Marking Completed..." : "Mark Meeting as Completed"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IceBreaker;

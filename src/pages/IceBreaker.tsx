import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, MessageCircle, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

type Meeting = {
  id: string;
  scheduled_at: string;
  requester_id: string;
  recipient_id: string;
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

  useEffect(() => {
    fetchMeetingData();
  }, [id]);

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
    const commonTag = commonTags[0] || "your interests";
    
    switch (stage) {
      case 1:
        return {
          icon: <Sparkles className="w-6 h-6" />,
          title: "Shared Interest",
          question: `What do you both enjoy about ${commonTag}?`,
        };
      case 2:
        return {
          icon: <MessageCircle className="w-6 h-6" />,
          title: "Deepening Connection",
          question: "What's one thing you're excited to learn or explore together?",
        };
      case 3:
        return {
          icon: <Target className="w-6 h-6" />,
          title: "Building Rapport",
          question: "How can you support each other's goals or interests?",
        };
    }
  };

  const handleNext = () => {
    if (stage < 3) {
      setStage((stage + 1) as Stage);
    } else {
      navigate("/meetings");
      toast({
        title: "Great conversation starter!",
        description: "Hope you have a meaningful meeting.",
      });
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
              Meeting with {otherUser.full_name}
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

          {commonTags.length > 0 && stage === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Common Interests:
              </p>
              <div className="flex flex-wrap gap-2">
                {commonTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
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

          <Button onClick={handleNext} className="w-full h-12" size="lg">
            {stage < 3 ? (
              <>
                Next Question
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              "Finish & Return to Meetings"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IceBreaker;

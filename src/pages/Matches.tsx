import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, X, Lightbulb, Users, Calendar, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDisplayName } from "@/lib/utils";

type UserMatch = {
  id: string;
  full_name: string;
  studies: string;
  role: string;
  avatar_url: string | null;
  avatar_type: string | null;
  tags: string[];
  bio: string | null;
};

const Matches = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<UserMatch[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        // Fetch profiles excluding current user
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, studies, role, avatar_url, avatar_type')
          .neq('id', session.user.id);

        if (profilesError) throw profilesError;

        // Fetch interests for these users
        const userIds = profiles?.map(p => p.id) || [];
        const { data: interests, error: interestsError } = await supabase
          .from('user_interests')
          .select('user_id, tags, bio')
          .in('user_id', userIds);

        if (interestsError) throw interestsError;

        // Combine data
        const combinedData: UserMatch[] = (profiles || []).map(profile => {
          const userInterest = interests?.find(i => i.user_id === profile.id);
          return {
            id: profile.id,
            full_name: profile.full_name || 'No Name',
            studies: profile.studies || 'Not specified',
            role: profile.role,
            avatar_url: profile.avatar_url,
            avatar_type: profile.avatar_type,
            tags: userInterest?.tags || [],
            bio: userInterest?.bio || null,
          };
        });

        setMatches(combinedData);
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

    fetchMatches();
  }, [navigate, toast]);

  const getMatchIcon = (type: string) => {
    switch (type) {
      case "Friendly":
        return <Heart className="w-4 h-4" />;
      case "Mentoring":
        return <Lightbulb className="w-4 h-4" />;
      case "Co-founding":
        return <Users className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading suggestions...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-screen-sm mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Suggested Connections
          </h1>
          <p className="text-muted-foreground">
            {matches.length} {matches.length === 1 ? 'person' : 'people'} you might want to connect with
          </p>
        </div>

        {matches.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No suggestions available yet. Check back soon!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={match.avatar_url || undefined} 
                      alt={match.full_name} 
                    />
                    <AvatarFallback className="text-lg">
                      {match.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">
                      {formatDisplayName(match.full_name)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {match.studies?.includes(' - ')
                        ? match.studies.split(' - ')[1]  // Show program
                        : match.studies
                      }
                    </p>
                    {match.studies?.includes(' - ') && (
                      <p className="text-xs text-muted-foreground">
                        {match.studies.split(' - ')[0]}  {/* Show study level */}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-1">
                      {match.role}
                    </Badge>
                  </div>
                </div>

                {match.bio && (
                  <p className="text-muted-foreground text-sm mb-3">{match.bio}</p>
                )}

                {match.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {match.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12"
                    onClick={() => navigate(`/user/${match.id}`)}
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    View Profile
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 h-12"
                    onClick={() => console.log("Connect", match.id)}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Connect
                  </Button>
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

export default Matches;

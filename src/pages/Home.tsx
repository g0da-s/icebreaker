import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Heart, Users, Lightbulb, Sparkles, Search, Calendar, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Match {
  user_id: string;
  full_name: string;
  email: string;
  studies?: string;
  role?: string;
  avatar_url?: string | null;
  avatar_type?: string | null;
  tags: string[];
  match_score?: number;
  reason?: string;
  bio?: string | null;
  earliest_available?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [featuredUsers, setFeaturedUsers] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    const fetchFeaturedUsers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch 4 random users excluding current user
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, studies, role, avatar_url, avatar_type, email')
          .neq('id', session.user.id)
          .limit(4);

        if (profilesError) throw profilesError;

        // Fetch interests for these users
        const userIds = profiles?.map(p => p.id) || [];
        const { data: interests } = await supabase
          .from('user_interests')
          .select('user_id, tags, bio')
          .in('user_id', userIds);

        // Combine data
        const featured: Match[] = (profiles || []).map(profile => {
          const userInterest = interests?.find(i => i.user_id === profile.id);
          return {
            user_id: profile.id,
            full_name: profile.full_name || 'No Name',
            email: profile.email,
            studies: profile.studies,
            role: profile.role,
            avatar_url: profile.avatar_url,
            avatar_type: profile.avatar_type,
            tags: userInterest?.tags || [],
            bio: userInterest?.bio || null,
          };
        });

        setFeaturedUsers(featured);
      } catch (error: any) {
        console.error('Error fetching featured users:', error);
      }
    };

    fetchFeaturedUsers();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a search query",
        description: "Tell us what you're looking for",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-match', {
        body: { searchQuery, userId }
      });

      if (error) throw error;

      setMatches(data.matches || []);
      
      if (data.matches?.length === 0) {
        toast({
          title: "No matches found",
          description: "Try a different search or adjust your interests",
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const hasResults = matches.length > 0 || featuredUsers.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* AI Search Section - Centered when no results, top when results */}
          <div className={`transition-all duration-500 ${hasResults ? 'mb-12' : 'min-h-[60vh] flex flex-col justify-center'}`}>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Find Your Perfect Match
              </h1>
              <p className="text-muted-foreground">
                Tell us what you're looking for
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                placeholder="E.g., 'looking for a co-founder with tech skills' or 'want to meet someone who loves photography'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 h-12 text-base placeholder:text-muted-foreground/50"
              />
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                size="icon"
                className="h-12 w-12 rounded-full transition-transform duration-200 hover:scale-90"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>

            {/* Quick search buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="transition-transform duration-200 hover:scale-95"
                onClick={() => { 
                  setSearchQuery("friendly meeting"); 
                  setTimeout(handleSearch, 100);
                }}
              >
                <Heart className="w-4 h-4 mr-2" />
                Friendly
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="transition-transform duration-200 hover:scale-95"
                onClick={() => { 
                  setSearchQuery("mentor"); 
                  setTimeout(handleSearch, 100);
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Mentor
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="transition-transform duration-200 hover:scale-95"
                onClick={() => { 
                  setSearchQuery("co-founder"); 
                  setTimeout(handleSearch, 100);
                }}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Co-founder
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="transition-transform duration-200 hover:scale-95"
                onClick={() => { 
                  setSearchQuery("surprise me"); 
                  setTimeout(handleSearch, 100);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Surprise Me
              </Button>
            </div>
          </div>

          {/* Match Results */}
          {matches.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Your Matches
              </h2>
              <div className="space-y-4">
                {matches.map((match) => (
                  <Card key={match.user_id} className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={match.avatar_type === 'upload' ? match.avatar_url || undefined : undefined} 
                          alt={match.full_name} 
                        />
                        <AvatarFallback className="text-lg">
                          {match.avatar_type === 'mascot' ? '🧊' : match.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-lg">
                            {match.full_name}
                          </h3>
                          {match.match_score && (
                            <Badge variant="default" className="shrink-0">
                              {match.match_score}% match
                            </Badge>
                          )}
                        </div>
                        {(match.studies || match.role) && (
                          <p className="text-sm text-muted-foreground">
                            {match.studies || match.role}
                          </p>
                        )}
                        {match.role && match.studies && (
                          <Badge variant="outline" className="mt-1">
                            {match.role}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {match.reason && (
                      <p className="text-muted-foreground text-sm mb-3">
                        {match.reason}
                      </p>
                    )}

                    {match.tags && match.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {match.tags.slice(0, 5).map((tag, idx) => (
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
                        className="flex-1 h-12 transition-transform duration-200 hover:scale-95"
                        onClick={() => navigate(`/user/${match.user_id}`)}
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        size="lg"
                        className="flex-1 h-12 transition-transform duration-200 hover:scale-95"
                        onClick={() => console.log("Schedule meeting", match.user_id)}
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Featured Users (shown when no search) */}
          {matches.length === 0 && !loading && featuredUsers.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Featured Members
              </h2>
              <p className="text-muted-foreground mb-4">
                Connect with these active community members
              </p>
              <div className="space-y-4">
                {featuredUsers.map((user) => (
                  <Card key={user.user_id} className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={user.avatar_type === 'upload' ? user.avatar_url || undefined : undefined} 
                          alt={user.full_name} 
                        />
                        <AvatarFallback className="text-lg">
                          {user.avatar_type === 'mascot' ? '🧊' : user.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {user.full_name}
                        </h3>
                        {user.studies && (
                          <p className="text-sm text-muted-foreground">{user.studies}</p>
                        )}
                        {user.role && (
                          <Badge variant="outline" className="mt-1">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-muted-foreground text-sm mb-3">{user.bio}</p>
                    )}

                    {user.tags && user.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {user.tags.slice(0, 5).map((tag, idx) => (
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
                        className="flex-1 h-12 transition-transform duration-200 hover:scale-95"
                        onClick={() => navigate(`/user/${user.user_id}`)}
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        size="lg"
                        className="flex-1 h-12 transition-transform duration-200 hover:scale-95"
                        onClick={() => console.log("Connect", user.user_id)}
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;

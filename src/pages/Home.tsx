import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Heart, Users, Lightbulb, Sparkles, Calendar, Eye, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QuickScheduleModal } from "@/components/QuickScheduleModal";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDisplayName } from "@/lib/utils";

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

type CategoryFilter = "friendly" | "mentoring" | "co-founding" | "surprise-me";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [featuredUsers, setFeaturedUsers] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [quickScheduleOpen, setQuickScheduleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const checkWelcomeAchievement = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      // Check if welcome toast already shown
      const welcomeShown = localStorage.getItem('welcome_achievement_shown');
      if (welcomeShown) return;

      try {
        // Check if user has the welcome achievement
        const { data: existingAchievement } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', user.id)
          .eq('achievement_definitions.slug', 'welcome_newcomer')
          .maybeSingle();

        // If user doesn't have the achievement, grant it
        if (!existingAchievement) {
          // Get the welcome achievement definition
          const { data: achievementDef } = await supabase
            .from('achievement_definitions')
            .select('id')
            .eq('slug', 'welcome_newcomer')
            .single();

          if (achievementDef) {
            // Grant the achievement to the user
            const { error: insertError } = await supabase
              .from('user_achievements')
              .insert({
                user_id: user.id,
                achievement_id: achievementDef.id
              });

            if (insertError) {
              console.error('Error granting welcome achievement:', insertError);
              return;
            }
          }
        }

        // Show the toast notification (for both new and retroactive grants)
        toast({
          title: "Achievement Unlocked: Welcome Aboard! 🏆",
          description: "You joined the community.",
        });
        localStorage.setItem('welcome_achievement_shown', 'true');
      } catch (error) {
        console.error('Error checking/granting welcome achievement:', error);
      }
    };

    checkWelcomeAchievement();
  }, [toast]);

  useEffect(() => {
    const fetchActiveCommunity = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch 8 recently active users excluding current user
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, studies, role, avatar_url, avatar_type, email, updated_at')
          .neq('id', session.user.id)
          .order('updated_at', { ascending: false })
          .limit(8);

        if (profilesError) throw profilesError;

        // Fetch interests for these users
        const userIds = profiles?.map(p => p.id) || [];
        const { data: interests } = await supabase
          .from('user_interests')
          .select('user_id, tags, bio')
          .in('user_id', userIds);

        // Combine data
        const community: Match[] = (profiles || []).map(profile => {
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

        setFeaturedUsers(community);
      } catch (error: any) {
        console.error('Error fetching active community:', error);
      }
    };

    fetchActiveCommunity();
  }, []);

  // Real-time search effect
  useEffect(() => {
    const performSearch = async () => {
      const hasText = searchQuery.trim().length > 0;
      const hasCategory = selectedCategory !== null;

      // Scenario D: Empty state - show featured users
      if (!hasText && !hasCategory) {
        setMatches([]);
        return;
      }

      setLoading(true);
      try {
        // Scenario C: Text only (no category)
        if (hasText && !hasCategory) {
          const { data, error } = await supabase.functions.invoke('ai-match', {
            body: { searchQuery, userId }
          });
          if (error) throw error;
          setMatches(data.matches || []);
        }
        // Scenario A & B: Category (with or without text)
        else if (hasCategory) {
          // Surprise Me logic
          if (selectedCategory === "surprise-me") {
            if (hasText) {
              // Surprise Me + text: use AI match
              const { data, error } = await supabase.functions.invoke('ai-match', {
                body: { searchQuery, userId }
              });
              if (error) throw error;
              setMatches(data.matches || []);
            } else {
              // Surprise Me only: randomized diverse selection
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, studies, role, avatar_url, avatar_type, email')
                .neq('id', session.user.id)
                .limit(6);

              if (profilesError) throw profilesError;

              const userIds = profiles?.map(p => p.id) || [];
              const { data: interests } = await supabase
                .from('user_interests')
                .select('user_id, tags, bio')
                .in('user_id', userIds);

              const diverseMatches: Match[] = (profiles || []).map(profile => {
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
              setMatches(diverseMatches);
            }
          } else {
            // Regular category filter (friendly, mentoring, co-founding)
            const categoryMap: Record<CategoryFilter, string> = {
              "friendly": "friendly",
              "mentoring": "mentor",
              "co-founding": "co-founder",
              "surprise-me": "surprise me"
            };
            
            const categoryQuery = categoryMap[selectedCategory];
            const combinedQuery = hasText 
              ? `${categoryQuery} ${searchQuery}` 
              : categoryQuery;

            const { data, error } = await supabase.functions.invoke('ai-match', {
              body: { searchQuery: combinedQuery, userId }
            });
            if (error) throw error;
            setMatches(data.matches || []);
          }
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

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, userId, toast]);


  // Determine if we're in search mode
  const isSearchMode = searchQuery.trim().length > 0 || selectedCategory !== null;
  const hasResults = matches.length > 0 || featuredUsers.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Section - Always at top */}
          <div className="mb-12">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Find Your Perfect Match
              </h1>
              <p className="text-muted-foreground">
                Tell us what you're looking for
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Search Input with Button */}
              <div className="relative">
                <Input
                  placeholder="E.g., 'tech skills' or 'photography enthusiast'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="w-full h-12 text-base placeholder:text-muted-foreground/50 pr-12"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 h-10 w-10"
                  disabled={loading}
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Category Filter Chips */}
              <ToggleGroup 
                type="single" 
                value={selectedCategory || ""}
                onValueChange={(value) => setSelectedCategory(value as CategoryFilter || null)}
                className="justify-start flex-wrap gap-2"
              >
                <ToggleGroupItem 
                  value="friendly" 
                  aria-label="Friendly meetings"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Friendly
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="mentoring" 
                  aria-label="Mentoring"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Mentoring
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="co-founding" 
                  aria-label="Co-founding"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Co-founding
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="surprise-me" 
                  aria-label="Surprise me"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Surprise Me
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* STATE B: Search Results */}
          {isSearchMode && matches.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Search Results
              </h2>
              <p className="text-muted-foreground mb-4">
                {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
              </p>
              <div className="space-y-4">
                {matches.map((match) => (
                  <Card key={match.user_id} className="p-5">
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
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-lg">
                            {formatDisplayName(match.full_name)}
                          </h3>
                          {match.match_score && (
                            <Badge variant="default" className="shrink-0">
                              {match.match_score}% match
                            </Badge>
                          )}
                        </div>
                        {(match.studies || match.role) && (
                          <p className="text-sm text-muted-foreground">
                            {match.studies?.includes(' - ')
                              ? match.studies.split(' - ')[1]  // Show program
                              : match.studies || match.role
                            }
                          </p>
                        )}
                        {match.studies?.includes(' - ') && (
                          <p className="text-xs text-muted-foreground">
                            {match.studies.split(' - ')[0]}  {/* Show study level */}
                          </p>
                        )}
                        {match.role && (
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
                        onClick={() => {
                          setSelectedUser({ id: match.user_id, name: formatDisplayName(match.full_name) });
                          setQuickScheduleOpen(true);
                        }}
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

          {/* STATE A: Active Community (Default/Idle Mode) */}
          {!isSearchMode && !loading && featuredUsers.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Active Community Members
              </h2>
              <p className="text-muted-foreground mb-4">
                Recently active members ready to connect
              </p>
              <div className="space-y-4">
                {featuredUsers.map((user) => (
                  <Card key={user.user_id} className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={user.avatar_url || undefined} 
                          alt={user.full_name} 
                        />
                        <AvatarFallback className="text-lg">
                          {user.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {formatDisplayName(user.full_name)}
                        </h3>
                        {user.studies && (
                          <p className="text-sm text-muted-foreground">
                            {user.studies?.includes(' - ')
                              ? user.studies.split(' - ')[1]  // Show program
                              : user.studies
                            }
                          </p>
                        )}
                        {user.studies?.includes(' - ') && (
                          <p className="text-xs text-muted-foreground">
                            {user.studies.split(' - ')[0]}  {/* Show study level */}
                          </p>
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
                        onClick={() => {
                          setSelectedUser({ id: user.user_id, name: formatDisplayName(user.full_name) });
                          setQuickScheduleOpen(true);
                        }}
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

          {/* No Results Message for Search Mode */}
          {isSearchMode && !loading && matches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">No matches found</p>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}

        </div>
      </div>

      {selectedUser && (
        <QuickScheduleModal
          open={quickScheduleOpen}
          onOpenChange={setQuickScheduleOpen}
          recipientId={selectedUser.id}
          recipientName={selectedUser.name}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Home;

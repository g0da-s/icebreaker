import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { GraduationCap, Rocket, Shuffle, Calendar, Eye, Search } from "lucide-react";
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
import { UserProfileModal } from "@/components/UserProfileModal";
import { formatDisplayName } from "@/lib/utils";

interface Match {
  user_id: string;
  full_name: string;
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

type CategoryFilter = "surprise-me" | "mentoring" | "co-founding";

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
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<Match | null>(null);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  
  const fullPlaceholder = "Tell us what you're looking for...";

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullPlaceholder.length) {
        setTypedPlaceholder(fullPlaceholder.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const checkWelcomeAchievement = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      // Check if welcome toast already shown
      try {
        // Step 1: Get the welcome achievement definition
        const { data: welcomeDef, error: defError } = await supabase
          .from('achievement_definitions')
          .select('id')
          .eq('slug', 'welcome')
          .maybeSingle();

        if (defError) {
          console.error('Error fetching welcome achievement:', defError);
          return;
        }

        if (!welcomeDef) {
          console.error('Welcome achievement not found in definitions');
          return;
        }

        // Step 2: Check if user already has this achievement
        const { data: existingAchievement, error: checkError } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', user.id)
          .eq('achievement_id', welcomeDef.id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking user achievements:', checkError);
          return;
        }

        // Step 3: If user doesn't have it, grant it now (UNIVERSAL AUTO-GRANT)
        if (!existingAchievement) {
          const { error: insertError } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: welcomeDef.id
            });

          if (insertError) {
            console.error('Error granting welcome achievement:', insertError);
            return;
          }

          // Step 4: Show the toast notification only once
          const welcomeShown = localStorage.getItem('welcome_achievement_shown');
          if (!welcomeShown) {
            toast({
              title: "Achievement Unlocked: Welcome Aboard! 🏆",
              description: "You joined the community.",
            });
            localStorage.setItem('welcome_achievement_shown', 'true');
          }
        }
      } catch (error) {
        console.error('Error in welcome achievement flow:', error);
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
          .from('public_profiles')
          .select('id, full_name, studies, role, avatar_url, avatar_type, updated_at')
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
                .from('public_profiles')
                .select('id, full_name, studies, role, avatar_url, avatar_type')
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
            // Regular category filter (mentoring, co-founding)
            const categoryMap: Record<CategoryFilter, string> = {
              "surprise-me": "surprise me",
              "mentoring": "mentor",
              "co-founding": "co-founder"
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
          {/* Search Section - Centered when not in search mode */}
          <div className={`mb-12 ${!isSearchMode ? 'min-h-[60vh] flex items-center justify-center' : ''}`}>
            <div className="w-full">
              <div className="text-center mb-6">
                {/* Active Now Indicator */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-muted-foreground">
                    Active now: {featuredUsers.length}
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Find Your First Icebreak
                </h1>
                <p className="text-muted-foreground">
                  Connect with peers, mentors, and collaborators
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* Search Input with Button */}
                <div className="relative">
                  <Input
                    placeholder={typedPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="w-full h-12 text-base placeholder:text-muted-foreground/50 pr-12 rounded-full"
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
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground">Choose what you're searching for</p>
                <div className="flex gap-2">
                  <ToggleGroup 
                    type="single" 
                    value={selectedCategory || ""}
                    onValueChange={(value) => setSelectedCategory(value as CategoryFilter || null)}
                    className="justify-center gap-2"
                  >
                    <ToggleGroupItem 
                      value="surprise-me" 
                      aria-label="Surprise me"
                      className="rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors px-3 h-8 text-sm"
                    >
                      <Shuffle className="w-3 h-3 mr-1.5" />
                      Surprise Me
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="mentoring" 
                      aria-label="Mentoring"
                      className="rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors px-3 h-8 text-sm"
                    >
                      <GraduationCap className="w-3 h-3 mr-1.5" />
                      Mentoring
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="co-founding" 
                      aria-label="Co-founding"
                      className="rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors px-3 h-8 text-sm"
                    >
                      <Rocket className="w-3 h-3 mr-1.5" />
                      Co-founding
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
              </div>
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

                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full bg-gradient-to-r from-white/5 via-white/20 to-white/5 hover:from-white/10 hover:via-white/30 hover:to-white/10 transition-all"
                        onClick={() => {
                          setSelectedProfileUser(match);
                          setProfileModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/80 hover:from-primary hover:via-primary/90 hover:to-primary transition-all"
                        onClick={() => {
                          setSelectedUser({ id: match.user_id, name: formatDisplayName(match.full_name) });
                          setQuickScheduleOpen(true);
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Meet Up
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

      {selectedProfileUser && (
        <UserProfileModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          user={selectedProfileUser}
          onScheduleMeeting={() => {
            setProfileModalOpen(false);
            setSelectedUser({ 
              id: selectedProfileUser.user_id, 
              name: formatDisplayName(selectedProfileUser.full_name) 
            });
            setQuickScheduleOpen(true);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Home;

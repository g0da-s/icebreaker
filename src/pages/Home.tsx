import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { GraduationCap, Rocket, Shuffle, Calendar, Eye, Search, Award, BookOpen, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
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
import logo from "@/assets/logo.png";

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
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  
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

  // Real-time presence tracking
  useEffect(() => {
    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase.channel('online-users');

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const userCount = Object.keys(state).length;
          setActiveUsersCount(userCount);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('User joined:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('User left:', leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });

      return () => {
        channel.unsubscribe();
      };
    };

    setupPresence();
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
              title: "❄️ First Icebreak!",
              description: "Welcome to the community",
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

  // Real-time search effect - ONLY triggers when there's text input
  useEffect(() => {
    const performSearch = async () => {
      const hasText = searchQuery.trim().length > 0;

      // STRICT RULE: No text = no search, always show featured users
      if (!hasText) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Only execute search when text is present
      setLoading(true);
      try {
        // Build search query with category as modifier
        let finalSearchQuery = searchQuery;
        
        if (selectedCategory && selectedCategory !== "surprise-me") {
          // Category acts as filter modifier for text search
          const categoryMap: Record<CategoryFilter, string> = {
            "surprise-me": "",
            "mentoring": "mentor",
            "co-founding": "co-founder"
          };
          
          const categoryModifier = categoryMap[selectedCategory];
          finalSearchQuery = `${categoryModifier} ${searchQuery}`;
        }

        // Execute AI match with text (and optional category filter)
        const { data, error } = await supabase.functions.invoke('ai-match', {
          body: { searchQuery: finalSearchQuery, userId }
        });
        
        if (error) throw error;
        setMatches(data.matches || []);
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


  // Search mode is ONLY active when there's text in the input
  const isSearchMode = searchQuery.trim().length > 0;
  const hasResults = matches.length > 0 || featuredUsers.length > 0;

  // Helper function to prioritize tags based on search query
  const getPrioritizedTags = (tags: string[], query: string) => {
    if (!query || !tags || tags.length === 0) return tags;
    
    const lowerQuery = query.toLowerCase();
    const matchingTags = tags.filter(tag => 
      tag.toLowerCase().includes(lowerQuery)
    );
    const nonMatchingTags = tags.filter(tag => 
      !tag.toLowerCase().includes(lowerQuery)
    );
    
    return [...matchingTags, ...nonMatchingTags];
  };

  // Helper function to get role icon
  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return <GraduationCap className="w-3 h-3" />;
      case 'alumni':
        return <Award className="w-3 h-3" />;
      case 'faculty':
        return <BookOpen className="w-3 h-3" />;
      case 'staff':
        return <Briefcase className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 pb-24 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [-20, 20, -20]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px]"
        />
        
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            y: [20, -20, 20]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-[40%] right-[10%] w-[700px] h-[700px] bg-violet-600/20 rounded-full blur-[130px]"
        />
        
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 4
          }}
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-700/15 rounded-full blur-[140px]"
        />
      </div>

      {/* Logo Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-slate-950/50 border-b border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="icebreaker.ai Logo" className="h-10 w-10 rounded-lg brightness-75" />
          <div className="text-xl font-bold tracking-tighter text-white">icebreaker.ai</div>
        </Link>
      </nav>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Section - Centered when not in search mode */}
          <div className="mb-12 min-h-[60vh] flex items-center justify-center">
            <div className="w-full">
              <div className="text-center mb-6">
                {/* Active Now Indicator */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 backdrop-blur-xl border border-white/10 shadow-lg mb-4"
                >
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </div>
                  <span className="text-sm text-slate-200">
                    Active now: {activeUsersCount}
                  </span>
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Find Your First Icebreak
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-300"
                >
                  Connect with peers, mentors, and collaborators
                </motion.p>
              </div>

              <div className="flex flex-col gap-3">
                {/* Search Input with Button */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative"
                >
                  <Input
                    placeholder={typedPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="w-full h-12 text-base placeholder:text-slate-400 pr-12 rounded-full bg-slate-800/40 backdrop-blur-xl border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-10 w-10 text-slate-300 hover:text-white hover:bg-white/10"
                    disabled={loading}
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </motion.div>
              
              {/* Category Filter Chips */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center gap-2"
              >
                <p className="text-xs text-slate-400">Choose what you're searching for</p>
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
                      className="rounded-full data-[state=on]:bg-gradient-to-r data-[state=on]:from-cyan-500 data-[state=on]:to-blue-600 data-[state=on]:text-white bg-slate-800/40 backdrop-blur-xl border border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all px-3 h-8 text-sm"
                    >
                      <Shuffle className="w-3 h-3 mr-1.5" />
                      Surprise Me
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="mentoring" 
                      aria-label="Mentoring"
                      className="rounded-full data-[state=on]:bg-gradient-to-r data-[state=on]:from-cyan-500 data-[state=on]:to-blue-600 data-[state=on]:text-white bg-slate-800/40 backdrop-blur-xl border border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all px-3 h-8 text-sm"
                    >
                      <GraduationCap className="w-3 h-3 mr-1.5" />
                      Mentoring
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="co-founding" 
                      aria-label="Co-founding"
                      className="rounded-full data-[state=on]:bg-gradient-to-r data-[state=on]:from-cyan-500 data-[state=on]:to-blue-600 data-[state=on]:text-white bg-slate-800/40 backdrop-blur-xl border border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all px-3 h-8 text-sm"
                    >
                      <Rocket className="w-3 h-3 mr-1.5" />
                      Co-founding
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </motion.div>
              </div>
            </div>
          </div>

          {/* STATE B: Search Results */}
          {isSearchMode && matches.length > 0 && (
            <div className="mb-12">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Search Results
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-300 mb-4"
              >
                {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
              </motion.p>
              <div className="space-y-4">
                {matches.map((match, index) => (
                  <motion.div
                    key={match.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-5 bg-slate-800/40 backdrop-blur-xl border-white/10 hover:bg-slate-800/60 hover:border-white/20 transition-all shadow-xl">
                    <div 
                      className="flex items-start gap-3 mb-4 cursor-pointer"
                      onClick={() => {
                        setSelectedProfileUser(match);
                        setProfileModalOpen(true);
                      }}
                    >
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
                        <h3 className="font-semibold text-white text-lg hover:text-cyan-400 transition-colors mb-1">
                          {formatDisplayName(match.full_name)}
                        </h3>
                        {match.role && (
                          <Badge className="mb-2 bg-white/10 text-white border-white/20 text-xs px-2 py-0.5 flex items-center gap-1 w-fit">
                            {getRoleIcon(match.role)}
                            {match.role}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2">
                          {match.match_score && (
                            <Badge className="shrink-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 text-xs px-2 py-0.5">
                              {match.match_score}% match
                            </Badge>
                          )}
                        </div>
                        {(match.studies || match.role) && (
                          <p className="text-sm text-slate-300 mt-1">
                            {match.studies?.includes(' - ')
                              ? match.studies.split(' - ')[1]
                              : match.studies
                            }
                          </p>
                        )}
                        {match.studies?.includes(' - ') && (
                          <p className="text-xs text-slate-400">
                            {match.studies.split(' - ')[0]}
                          </p>
                        )}
                      </div>
                    </div>

                    {match.reason && (
                      <p className="text-slate-300 text-sm mb-3">
                        {match.reason}
                      </p>
                    )}

                    {match.tags && match.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(() => {
                          const prioritizedTags = getPrioritizedTags(match.tags, searchQuery);
                          const displayTags = prioritizedTags.slice(0, 2);
                          const remainingCount = match.tags.length - 2;
                          
                          return (
                            <>
                              {displayTags.map((tag, idx) => (
                                <Badge key={idx} className="text-xs bg-slate-700/50 text-slate-200 border-white/10 hover:bg-slate-600/50">
                                  {tag}
                                </Badge>
                              ))}
                              {remainingCount > 0 && (
                                <Badge className="text-xs bg-slate-700/30 text-slate-300 border-white/10">
                                  +{remainingCount}
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProfileUser(match);
                          setProfileModalOpen(true);
                        }}
                        className="flex-1 rounded-full bg-slate-700/30 backdrop-blur-sm hover:bg-slate-600/50 border-white/20 text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser({ id: match.user_id, name: formatDisplayName(match.full_name) });
                          setQuickScheduleOpen(true);
                        }}
                        className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/20"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Meet Up
                      </Button>
                    </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Message for Search Mode */}
          {isSearchMode && !loading && matches.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-slate-300 text-lg mb-2">No matches found</p>
              <p className="text-slate-400 text-sm">
                Try adjusting your search or filter criteria
              </p>
            </motion.div>
          )}

          {/* STATE A: Active Community Members (Default View) */}
          {!isSearchMode && featuredUsers.length > 0 && (
            <div className="mb-12">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Active Community Members
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-300 mb-4"
              >
                Recently active members you can connect with
              </motion.p>
              <div className="space-y-4">
                {featuredUsers.map((user, index) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-5 bg-slate-800/40 backdrop-blur-xl border-white/10 hover:bg-slate-800/60 hover:border-white/20 transition-all shadow-xl">
                    <div 
                      className="flex items-start gap-3 mb-4 cursor-pointer"
                      onClick={() => {
                        setSelectedProfileUser(user);
                        setProfileModalOpen(true);
                      }}
                    >
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
                        <h3 className="font-semibold text-white text-lg hover:text-cyan-400 transition-colors mb-1">
                          {formatDisplayName(user.full_name)}
                        </h3>
                        {user.role && (
                          <Badge className="mb-2 bg-white/10 text-white border-white/20 text-xs px-2 py-0.5 flex items-center gap-1 w-fit">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </Badge>
                        )}
                        {(user.studies || user.role) && (
                          <p className="text-sm text-slate-300">
                            {user.studies?.includes(' - ')
                              ? user.studies.split(' - ')[1]
                              : user.studies
                            }
                          </p>
                        )}
                        {user.studies?.includes(' - ') && (
                          <p className="text-xs text-slate-400">
                            {user.studies.split(' - ')[0]}
                          </p>
                        )}
                      </div>
                    </div>

                    {user.tags && user.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {user.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} className="text-xs bg-slate-700/50 text-slate-200 border-white/10 hover:bg-slate-600/50">
                            {tag}
                          </Badge>
                        ))}
                        {user.tags.length > 3 && (
                          <Badge className="text-xs bg-slate-700/30 text-slate-300 border-white/10">
                            +{user.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProfileUser(user);
                          setProfileModalOpen(true);
                        }}
                        className="flex-1 rounded-full bg-slate-700/30 backdrop-blur-sm hover:bg-slate-600/50 border-white/20 text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser({ id: user.user_id, name: formatDisplayName(user.full_name) });
                          setQuickScheduleOpen(true);
                        }}
                        className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/20"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Meet Up
                      </Button>
                    </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
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

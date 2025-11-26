import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

interface AchievementDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_locked_url: string;
  image_unlocked_url: string;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

interface AchievementDisplay extends AchievementDefinition {
  isUnlocked: boolean;
  unlockedAt?: string;
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<AchievementDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedMeetings, setCompletedMeetings] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your achievements",
          variant: "destructive",
        });
        return;
      }

      // STEP A: Fetch total count of completed meetings for the user
      const { count: meetingsCount } = await supabase
        .from("meetings")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      const totalCompleted = meetingsCount || 0;

      // Fetch all achievement definitions
      const { data: definitions, error: defError } = await supabase
        .from("achievement_definitions")
        .select("*")
        .order("slug");

      if (defError) throw defError;

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: userError } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);

      if (userError) throw userError;

      // STEP B: Auto-Sync - Check and grant missing milestone badges
      const userAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      let newlyUnlocked = false;
      
      // Check 1: Welcome badge (always grant if missing)
      const welcomeDef = definitions?.find(def => def.slug === 'welcome');
      if (welcomeDef && !userAchievementIds.has(welcomeDef.id)) {
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({ user_id: user.id, achievement_id: welcomeDef.id });

        if (!insertError) {
          newlyUnlocked = true;
          userAchievementIds.add(welcomeDef.id);
        }
      }

      // Check 2: Meeting milestone badges
      const milestones = [
        { threshold: 1, slug: 'meeting_1', title: 'Ice Cracker' },
        { threshold: 5, slug: 'meeting_5', title: 'Arctic Explorer' },
        { threshold: 15, slug: 'meeting_15', title: 'Glacier Guide' },
        { threshold: 30, slug: 'meeting_30', title: 'Grand Ice Master' },
      ];

      for (const milestone of milestones) {
        if (totalCompleted >= milestone.threshold) {
          const achievementDef = definitions?.find(def => def.slug === milestone.slug);
          
          if (achievementDef && !userAchievementIds.has(achievementDef.id)) {
            // User has earned this badge but doesn't have it - grant it now
            const { error: insertError } = await supabase
              .from('user_achievements')
              .insert({ user_id: user.id, achievement_id: achievementDef.id });

            if (!insertError) {
              newlyUnlocked = true;
              toast({
                title: `Achievement Unlocked: ${milestone.title}! 🏆`,
                description: `You've completed ${milestone.threshold} meeting${milestone.threshold > 1 ? 's' : ''}!`,
              });
              // Add to the set so we don't try to unlock it again in this session
              userAchievementIds.add(achievementDef.id);
            }
          }
        }
      }

      // If we unlocked new badges, refetch user achievements to get the correct unlocked_at timestamps
      let finalUserAchievements = userAchievements;
      if (newlyUnlocked) {
        const { data: refreshedAchievements } = await supabase
          .from("user_achievements")
          .select("achievement_id, unlocked_at")
          .eq("user_id", user.id);
        finalUserAchievements = refreshedAchievements || userAchievements;
      }

      // Combine the data
      const achievementMap = new Map(
        finalUserAchievements?.map((ua: UserAchievement) => [ua.achievement_id, ua.unlocked_at]) || []
      );

      const displayAchievements: AchievementDisplay[] = (definitions || []).map((def: AchievementDefinition) => ({
        ...def,
        isUnlocked: achievementMap.has(def.id),
        unlockedAt: achievementMap.get(def.id),
      }));

      // Priority Sort Order:
      // 1. Welcome badge (slug: 'welcome') - always first
      // 2. Other unlocked badges - sorted by unlock date (newest first)
      // 3. Locked badges - sorted by required meeting count (ascending)
      displayAchievements.sort((a, b) => {
        // Welcome badge always first
        if (a.slug === 'welcome') return -1;
        if (b.slug === 'welcome') return 1;

        // Both unlocked - sort by unlock date (newest first)
        if (a.isUnlocked && b.isUnlocked) {
          const dateA = new Date(a.unlockedAt || 0).getTime();
          const dateB = new Date(b.unlockedAt || 0).getTime();
          return dateB - dateA;
        }

        // One unlocked, one locked - unlocked first
        if (a.isUnlocked && !b.isUnlocked) return -1;
        if (!a.isUnlocked && b.isUnlocked) return 1;

        // Both locked - sort by meeting threshold (ascending)
        const getMeetingThreshold = (slug: string) => {
          if (slug === 'meeting_1') return 1;
          if (slug === 'meeting_5') return 5;
          if (slug === 'meeting_15') return 15;
          if (slug === 'meeting_30') return 30;
          return 999;
        };
        return getMeetingThreshold(a.slug) - getMeetingThreshold(b.slug);
      });

      setAchievements(displayAchievements);

      // Fetch completed meetings count
      const { count, error: countError } = await supabase
        .from("meetings")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (countError) {
        console.error("Error counting completed meetings:", countError);
      } else {
        setCompletedMeetings(count || 0);
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast({
        title: "Error loading achievements",
        description: "Failed to load your achievements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center pb-24 overflow-hidden">
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
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 relative z-10" />
      </div>
    );
  }

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

      <div className="relative z-10 container max-w-6xl mx-auto px-4 pt-24 pb-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-slate-300">
            Track your progress and unlock badges as you connect with others
          </p>
        </motion.div>

        <Card className="mb-8 bg-slate-900/30 backdrop-blur-xl border-cyan-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-300 mb-1">Successful Meetings</p>
              <p className="text-4xl font-bold text-cyan-400">{completedMeetings}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`transition-all ${
                achievement.isUnlocked
                  ? "bg-slate-900/40 backdrop-blur-xl border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900/20 backdrop-blur-xl border-white/10 opacity-75"
              }`}
            >
              <CardHeader className="text-center p-4">
                <div className="flex justify-center mb-3">
                  <div className="relative w-20 h-20">
                    <img
                      src={achievement.image_unlocked_url}
                      alt={achievement.isUnlocked ? achievement.title : "Locked achievement"}
                      className={`w-full h-full object-contain rounded-full transition-all duration-300 ${
                        !achievement.isUnlocked ? 'grayscale opacity-50' : ''
                      }`}
                    />
                  </div>
                </div>
                <CardTitle className="text-sm text-white">
                  {achievement.isUnlocked ? achievement.title : "???"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-300 line-clamp-2">
                  {achievement.isUnlocked
                    ? achievement.description
                    : "Keep meeting to unlock"}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-4 pt-0">
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <p className="text-xs text-slate-400">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

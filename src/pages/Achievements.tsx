import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

      // Sort: unlocked first, then locked
      displayAchievements.sort((a, b) => {
        if (a.isUnlocked && !b.isUnlocked) return -1;
        if (!a.isUnlocked && b.isUnlocked) return 1;
        return 0;
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
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress and unlock badges as you connect with others
          </p>
        </div>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Successful Meetings</p>
              <p className="text-4xl font-bold text-primary">{completedMeetings}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`transition-all ${
                achievement.isUnlocked
                  ? "border-primary/50 shadow-lg"
                  : "border-muted opacity-75"
              }`}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <img
                      src={achievement.image_unlocked_url}
                      alt={achievement.isUnlocked ? achievement.title : "Locked achievement"}
                      className={`w-full h-full object-contain rounded-full transition-all duration-300 ${
                        !achievement.isUnlocked ? 'grayscale opacity-50' : ''
                      }`}
                    />
                  </div>
                </div>
                <CardTitle className="text-xl">
                  {achievement.isUnlocked ? achievement.title : "???"}
                </CardTitle>
                <CardDescription>
                  {achievement.isUnlocked
                    ? achievement.description
                    : "Keep meeting to unlock"}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <p className="text-sm text-muted-foreground">
                    Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
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

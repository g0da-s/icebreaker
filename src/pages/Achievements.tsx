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

      // Combine the data
      const achievementMap = new Map(
        userAchievements?.map((ua: UserAchievement) => [ua.achievement_id, ua.unlocked_at]) || []
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
                      src={achievement.isUnlocked ? achievement.image_unlocked_url : achievement.image_locked_url}
                      alt={achievement.isUnlocked ? achievement.title : "Locked achievement"}
                      className="w-full h-full object-contain rounded-full transition-all duration-300"
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
              {achievement.isUnlocked && achievement.unlockedAt && (
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

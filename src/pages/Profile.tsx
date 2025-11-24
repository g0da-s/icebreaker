import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogOut, Edit } from "lucide-react";
import { format } from "date-fns";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [interests, setInterests] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        // Fetch from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch from user_interests table
        const { data: interestsData } = await supabase
          .from('user_interests')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setProfile(profileData);
        setInterests(interestsData);
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

    fetchProfile();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Profile not found</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-screen-sm mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {profile.full_name || "No name"}
                </h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge variant="secondary" className="mt-1">
                  {profile.role}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/edit-profile">
                <Edit className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            {profile.location && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Location
                </h3>
                <p className="text-sm text-muted-foreground">{profile.location}</p>
              </div>
            )}

            {interests?.bio && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Bio
                </h3>
                <p className="text-sm text-muted-foreground">{interests.bio}</p>
              </div>
            )}

            {interests?.tags && interests.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Interests & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interests.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.availability && Object.keys(profile.availability).some((day: string) => profile.availability[day]?.active) && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Availability
                </h3>
                <div className="space-y-2">
                  {Object.entries(profile.availability).map(([day, schedule]: [string, any]) => (
                    schedule?.active && (
                      <div key={day} className="text-sm">
                        <span className="capitalize font-medium">{day}:</span>{" "}
                        <span className="text-muted-foreground">
                          {schedule.start} - {schedule.end}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {interests?.linkedin_url && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  LinkedIn
                </h3>
                <Button variant="outline" size="sm" className="h-10" asChild>
                  <a
                    href={interests.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View LinkedIn Profile
                  </a>
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Settings Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 justify-start text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;

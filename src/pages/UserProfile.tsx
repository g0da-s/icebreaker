import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar } from "lucide-react";
import { ScheduleMeetingModal } from "@/components/ScheduleMeetingModal";

type UserProfileData = {
  id: string;
  full_name: string;
  email: string;
  studies: string;
  role: string;
  location: string;
  birth_date: string | null;
  avatar_url: string | null;
  avatar_type: string | null;
  availability: any;
  tags: string[];
  bio: string | null;
};

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        navigate("/matches");
        return;
      }

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;

        // Fetch interests
        const { data: interestsData } = await supabase
          .from('user_interests')
          .select('tags, bio')
          .eq('user_id', id)
          .maybeSingle();

        setProfile({
          id: profileData.id,
          full_name: profileData.full_name || 'No Name',
          email: profileData.email,
          studies: profileData.studies || 'Not specified',
          role: profileData.role,
          location: profileData.location || 'Not specified',
          birth_date: profileData.birth_date,
          avatar_url: profileData.avatar_url,
          avatar_type: profileData.avatar_type,
          availability: profileData.availability,
          tags: interestsData?.tags || [],
          bio: interestsData?.bio || null,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        navigate("/matches");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading profile...</p>
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
          <div className="flex justify-center mt-4">
            <Button onClick={() => navigate("/matches")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Matches
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-screen-sm mx-auto px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/matches")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Matches
        </Button>

        {/* Profile Card */}
        <Card className="p-6 mb-4">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage 
                src={profile.avatar_type === 'upload' ? profile.avatar_url || undefined : undefined} 
                alt={profile.full_name} 
              />
              <AvatarFallback className="text-3xl">
                {profile.avatar_type === 'mascot' ? '🧊' : profile.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {profile.full_name}
            </h1>
            <p className="text-muted-foreground mb-2">{profile.studies}</p>
            <Badge variant="secondary">{profile.role}</Badge>
          </div>

          <Separator className="my-4" />

          {/* Profile Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Location
              </h3>
              <p className="text-sm text-muted-foreground">{profile.location}</p>
            </div>

            {profile.bio && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  About
                </h3>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {profile.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Interests & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag, index) => (
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
                  Weekly Availability
                </h3>
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  {Object.entries(profile.availability).map(([day, schedule]: [string, any]) => (
                    schedule?.active && (
                      <div key={day} className="text-sm flex justify-between">
                        <span className="capitalize font-medium">{day}</span>
                        <span className="text-muted-foreground">
                          {schedule.start} - {schedule.end}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            size="lg" 
            className="w-full h-12"
            onClick={() => setScheduleMeetingOpen(true)}
          >
            <Calendar className="w-5 h-5 mr-2" />
            Schedule a Meeting
          </Button>
        </div>
      </div>

      <ScheduleMeetingModal
        open={scheduleMeetingOpen}
        onOpenChange={setScheduleMeetingOpen}
        recipientId={profile.id}
        recipientName={profile.full_name}
        recipientAvailability={profile.availability}
      />

      <BottomNav />
    </div>
  );
};

export default UserProfile;

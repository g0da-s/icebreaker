import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogOut, Edit } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
    navigate("/");
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#3d4654] pb-24">
        <div className="relative z-10 container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-slate-300">Loading...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="relative min-h-screen bg-[#3d4654] pb-24">
        <div className="relative z-10 container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-slate-300">Profile not found</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#3d4654] pb-24">
      {/* Logo Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-slate-950/30 border-b border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="icebreaker.ai Logo" className="h-10 w-10 rounded-lg brightness-75" />
          <div className="text-xl font-bold tracking-tighter text-white">icebreaker.ai</div>
        </Link>
      </nav>

      <div className="relative z-10 container max-w-2xl mx-auto px-4 pt-24 pb-6">
        {/* Main Profile Container */}
        <div className="bg-slate-800 rounded-3xl border border-slate-600/50 shadow-2xl p-8">
          {/* Header Section */}
          <div className="flex items-start gap-4 mb-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || profile.email}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-white flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-1">
                {profile.full_name || "No name"}
              </h2>
              <p className="text-sm text-slate-400 mb-1">{profile.email}</p>
              <p className="text-sm text-slate-400">{profile.role}</p>
            </div>

            {/* Edit Icon */}
            <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10 flex-shrink-0">
              <Link to="/edit-profile">
                <Edit className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Studies Section */}
          {profile.studies && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-white mb-3">
                Studies
              </h3>
              <p className="text-sm text-slate-400 mb-1">
                {profile.studies?.includes(' - ') 
                  ? profile.studies.split(' - ')[1]
                  : profile.studies
                }
              </p>
              {profile.studies?.includes(' - ') && (
                <p className="text-xs text-slate-500">
                  {profile.studies.split(' - ')[0]}
                </p>
              )}
            </div>
          )}

          {/* Bio Section */}
          {interests?.bio && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-white mb-3">
                Bio
              </h3>
              <p className="text-sm text-slate-400">{interests.bio}</p>
            </div>
          )}

          {/* Interests & Skills Section */}
          {interests?.tags && interests.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-white mb-3">
                Interests & Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {interests.tags.map((tag: string, index: number) => (
                  <span 
                    key={index} 
                    className="px-4 py-2 bg-indigo-900/50 text-slate-300 text-sm rounded-full border border-indigo-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability Section */}
          {profile.availability && Object.keys(profile.availability).some((day: string) => profile.availability[day]?.active) && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-white mb-3">
                Availability
              </h3>
              <div className="space-y-2">
                {DAY_ORDER.map((day) => {
                  const schedule = profile.availability[day];
                  return schedule?.active && (
                    <div key={day} className="text-sm text-slate-400">
                      <span className="capitalize">{day}: {schedule.start} - {schedule.end}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LinkedIn Section */}
          {interests?.linkedin_url && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-white mb-3">
                LinkedIn
              </h3>
              <Button variant="outline" size="sm" className="h-10 bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700" asChild>
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

          {/* Footer/Action Section */}
          <div className="pt-6 border-t border-slate-700">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;

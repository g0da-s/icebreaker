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

        <div className="relative z-10 container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-slate-300">Loading...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
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

        <div className="relative z-10 container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-slate-300">Profile not found</p>
        </div>
        <BottomNav />
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

      <div className="relative z-10 container max-w-screen-sm mx-auto px-4 pt-24 pb-6">
        {/* Profile Header */}
        <LiquidCrystalCard className="p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || profile.email}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-cyan-400">
                    {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {profile.full_name || "No name"}
                </h2>
                <p className="text-sm text-slate-300">{profile.email}</p>
                <Badge variant="secondary" className="mt-1 bg-slate-700/50 text-slate-200">
                  {profile.role}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10">
              <Link to="/edit-profile">
                <Edit className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          <Separator className="my-4 bg-white/10" />

          <div className="space-y-4">
            {profile.studies && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Studies
                </h3>
                <p className="text-sm text-slate-300">
                  {profile.studies?.includes(' - ') 
                    ? profile.studies.split(' - ')[1]
                    : profile.studies
                  }
                </p>
                {profile.studies?.includes(' - ') && (
                  <p className="text-xs text-slate-400 mt-1">
                    {profile.studies.split(' - ')[0]}
                  </p>
                )}
              </div>
            )}

            {interests?.bio && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Bio
                </h3>
                <p className="text-sm text-slate-300">{interests.bio}</p>
              </div>
            )}

            {interests?.tags && interests.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Interests & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interests.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-slate-700/30 text-slate-200 border-white/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.availability && Object.keys(profile.availability).some((day: string) => profile.availability[day]?.active) && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Availability
                </h3>
                <div className="space-y-2">
                  {DAY_ORDER.map((day) => {
                    const schedule = profile.availability[day];
                    return schedule?.active && (
                      <div key={day} className="text-sm">
                        <span className="capitalize font-medium text-white">{day}:</span>{" "}
                        <span className="text-slate-300">
                          {schedule.start} - {schedule.end}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {interests?.linkedin_url && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  LinkedIn
                </h3>
                <Button variant="outline" size="sm" className="h-10 bg-slate-800/50 text-slate-200 border-white/20 hover:bg-slate-700/50" asChild>
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
        </LiquidCrystalCard>

        {/* Settings Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 justify-start bg-slate-900/30 backdrop-blur-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
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

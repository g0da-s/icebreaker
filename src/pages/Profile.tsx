import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";
import { GlassCard } from "@/components/landing/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Edit, ChevronRight } from "lucide-react";
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
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

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
        <LiquidCrystalCard className="p-8">
          {/* Edit Button - Top Right */}
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10">
              <Link to="/edit-profile">
                <Edit className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Centered Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || profile.email}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl mb-6"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-slate-700 border-4 border-white flex items-center justify-center shadow-xl mb-6">
                <span className="text-4xl font-bold text-white">
                  {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                </span>
              </div>
            )}

            {/* Name */}
            <h2 className="text-2xl font-bold text-white mb-6">
              {profile.full_name || "No name"}
            </h2>

            {/* Email and Role in Glass Cards */}
            <div className="flex flex-col gap-3 w-full max-w-md">
              <GlassCard className="px-6 py-3">
                <p className="text-sm text-slate-300 text-center">{profile.email}</p>
              </GlassCard>
              <GlassCard className="px-6 py-3">
                <p className="text-sm text-slate-300 text-center capitalize">{profile.role}</p>
              </GlassCard>
            </div>
          </div>

          {/* Content Sections Grid - 3 columns on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* About Section */}
            {interests?.bio && (
              <GlassCard 
                className="p-4 cursor-pointer" 
                hoverEffect
                onClick={() => setSelectedSection('about')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">About</h3>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">{interests.bio}</p>
              </GlassCard>
            )}

            {/* Studies Section */}
            {profile.studies && (
              <GlassCard 
                className="p-4 cursor-pointer" 
                hoverEffect
                onClick={() => setSelectedSection('studies')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">Studies</h3>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {profile.studies?.includes(' - ') 
                    ? profile.studies.split(' - ')[1]
                    : profile.studies
                  }
                </p>
              </GlassCard>
            )}

            {/* Interests & Skills Section */}
            {interests?.tags && interests.tags.length > 0 && (
              <GlassCard 
                className="p-4 cursor-pointer" 
                hoverEffect
                onClick={() => setSelectedSection('interests')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">Interests & Skills</h3>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {interests.tags.slice(0, 2).map((tag: string, index: number) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-indigo-900/50 text-slate-300 text-xs rounded-full border border-indigo-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                  {interests.tags.length > 2 && (
                    <span className="px-2 py-1 text-xs text-slate-400">
                      +{interests.tags.length - 2} more
                    </span>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Availability Section */}
            {profile.availability && Object.keys(profile.availability).some((day: string) => profile.availability[day]?.active) && (
              <GlassCard 
                className="p-4 cursor-pointer" 
                hoverEffect
                onClick={() => setSelectedSection('availability')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">Availability</h3>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-1">
                  {DAY_ORDER.slice(0, 2).map((day) => {
                    const schedule = profile.availability[day];
                    return schedule?.active && (
                      <div key={day} className="text-xs text-slate-300">
                        <span className="capitalize">{day}: {schedule.start} - {schedule.end}</span>
                      </div>
                    );
                  })}
                  {DAY_ORDER.filter(day => profile.availability[day]?.active).length > 2 && (
                    <p className="text-xs text-slate-400">+{DAY_ORDER.filter(day => profile.availability[day]?.active).length - 2} more days</p>
                  )}
                </div>
              </GlassCard>
            )}

            {/* LinkedIn Section */}
            {interests?.linkedin_url && (
              <GlassCard 
                className="p-4 cursor-pointer" 
                hoverEffect
                onClick={() => setSelectedSection('linkedin')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">LinkedIn</h3>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-300 truncate">View Profile</p>
              </GlassCard>
            )}
          </div>

          {/* Detail Modals */}
          <Dialog open={selectedSection === 'about'} onOpenChange={() => setSelectedSection(null)}>
            <DialogContent className="bg-transparent border-0 max-w-2xl">
              <LiquidCrystalCard className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white mb-4">About</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-300 leading-relaxed">{interests?.bio}</p>
              </LiquidCrystalCard>
            </DialogContent>
          </Dialog>

          <Dialog open={selectedSection === 'studies'} onOpenChange={() => setSelectedSection(null)}>
            <DialogContent className="bg-transparent border-0 max-w-2xl">
              <LiquidCrystalCard className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white mb-4">Studies</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-300 mb-2">
                  {profile.studies?.includes(' - ') 
                    ? profile.studies.split(' - ')[1]
                    : profile.studies
                  }
                </p>
                {profile.studies?.includes(' - ') && (
                  <p className="text-xs text-slate-400">
                    {profile.studies.split(' - ')[0]}
                  </p>
                )}
              </LiquidCrystalCard>
            </DialogContent>
          </Dialog>

          <Dialog open={selectedSection === 'interests'} onOpenChange={() => setSelectedSection(null)}>
            <DialogContent className="bg-transparent border-0 max-w-2xl">
              <LiquidCrystalCard className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white mb-4">Interests & Skills</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap gap-2">
                  {interests?.tags?.map((tag: string, index: number) => (
                    <span 
                      key={index} 
                      className="px-4 py-2 bg-indigo-900/50 text-slate-300 text-sm rounded-full border border-indigo-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </LiquidCrystalCard>
            </DialogContent>
          </Dialog>

          <Dialog open={selectedSection === 'availability'} onOpenChange={() => setSelectedSection(null)}>
            <DialogContent className="bg-transparent border-0 max-w-2xl">
              <LiquidCrystalCard className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white mb-4">Availability</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {DAY_ORDER.map((day) => {
                    const schedule = profile.availability?.[day];
                    return schedule?.active && (
                      <div key={day} className="text-sm text-slate-300">
                        <span className="capitalize">{day}: {schedule.start} - {schedule.end}</span>
                      </div>
                    );
                  })}
                </div>
              </LiquidCrystalCard>
            </DialogContent>
          </Dialog>

          <Dialog open={selectedSection === 'linkedin'} onOpenChange={() => setSelectedSection(null)}>
            <DialogContent className="bg-transparent border-0 max-w-2xl">
              <LiquidCrystalCard className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white mb-4">LinkedIn</DialogTitle>
                </DialogHeader>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-12 bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700" 
                  asChild
                >
                  <a
                    href={interests?.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View LinkedIn Profile
                  </a>
                </Button>
              </LiquidCrystalCard>
            </DialogContent>
          </Dialog>

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
        </LiquidCrystalCard>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;

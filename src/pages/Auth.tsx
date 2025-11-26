import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, ArrowLeft, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";
const Auth = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('mode') === 'signin' ? 'signin' : 'signup';
  const [isLoading, setIsLoading] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const allowedDomains = ['@ism.lt', '@stud.ism.lt', '@faculty.ism.lt'];

  // Redirect if already logged in
  useEffect(() => {
    const checkSessionAndProfile = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        // Check if user has completed profile setup
        const {
          data: interests
        } = await supabase.from('user_interests').select('id').eq('user_id', session.user.id).maybeSingle();
        if (interests) {
          navigate("/dashboard");
        } else {
          navigate("/profile-setup");
        }
      }
    };
    checkSessionAndProfile();
  }, [navigate]);
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    // Validate allowed domains
    const isValidDomain = allowedDomains.some(domain => email.endsWith(domain));
    if (!isValidDomain) {
      toast({
        title: "Access Restricted",
        description: "Please use your official university email (@ism.lt, @stud.ism.lt, or @faculty.ism.lt).",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    const {
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setShowAchievement(true);
      setTimeout(() => {
        setShowAchievement(false);
        navigate("/profile-setup");
      }, 3000);
    }
    setIsLoading(false);
  };
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "Signed in successfully."
      });
      navigate("/home");
    }
    setIsLoading(false);
  };
  return <>
      <Dialog open={showAchievement} onOpenChange={setShowAchievement}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Award className="w-12 h-12 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">Achievement Unlocked</DialogTitle>
            <DialogDescription className="text-center text-lg font-semibold">
              New on Ice
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
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
            animate={{ y: [0, 50, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-700/15 rounded-full blur-[140px] opacity-30"
          />
        </div>

        <Link to="/" className="absolute top-4 left-4 text-white/70 hover:text-white transition-colors z-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <LiquidCrystalCard className="w-full max-w-md z-10 p-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-cyan-500/10 p-3 rounded-full">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to icebreaker.ai</h1>
          <p className="text-white/60 text-sm">Tap to crack the ice and meet someone new.</p>
        </div>
        
        <div>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
              <TabsTrigger value="signup" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Register</TabsTrigger>
              <TabsTrigger value="signin" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Sign In</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-firstName" className="text-white/90">First Name</Label>
                    <Input id="signup-firstName" name="firstName" placeholder="John" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-lastName" className="text-white/90">Last Name</Label>
                    <Input id="signup-lastName" name="lastName" placeholder="Doe" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white/90">University Email</Label>
                  <Input id="signup-email" name="email" type="email" placeholder="your.name@stud.ism.lt" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                  <p className="text-xs text-white/50">
                    Enter your student, faculty, or staff email.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white/90">Password</Label>
                  <Input id="signup-password" name="password" type="password" placeholder="••••••••" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-full bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all shadow-xl hover:shadow-2xl" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "create as liquid glass"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-white/90">Email</Label>
                  <Input id="signin-email" name="email" type="email" placeholder="your.name@ism.lt" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-white/90">Password</Label>
                  <Input id="signin-password" name="password" type="password" placeholder="••••••••" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-full bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all shadow-xl hover:shadow-2xl" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </LiquidCrystalCard>
    </div>
    </>;
};
export default Auth;
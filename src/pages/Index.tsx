import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Heart, Lightbulb, Sparkles, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, useScroll, useTransform } from "framer-motion";
import { LiquidCrystalCard } from "@/components/ui/LiquidCrystalCard";
import { Marquee } from "@/components/Marquee";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { scrollY } = useScroll();
  
  const y1 = useTransform(scrollY, [0, 3000], [0, 600]); 
  const y2 = useTransform(scrollY, [0, 3000], [0, -600]);
  const y3 = useTransform(scrollY, [0, 3000], [0, 300]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(to bottom, #020617 0%, #0f172a 50%, #1e293b 100%)' }}>
      <Header />
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y: y1 }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
            rotate: [0, 90, 0]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/60 rounded-full blur-[100px] mix-blend-screen" 
        />
        <motion.div 
          style={{ y: y2 }}
          animate={{ 
            x: [-50, 50, -50],
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-[20%] left-[10%] w-[450px] h-[450px] bg-cyan-500/50 rounded-full blur-[90px] mix-blend-screen" 
        />
        <motion.div 
          style={{ y: y3 }}
          animate={{ 
            x: [50, -50, 50],
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-indigo-500/50 rounded-full blur-[80px] mix-blend-screen" 
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-32 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10 mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">Currently exclusive only for ISM</span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="z-10 max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Connect Without the
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
              Pressure
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            AI-powered matching for ISM students. Find friends, mentors, and co-founders based on shared interests - not appearances.
          </p>
          
          {!isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button asChild size="lg" className="text-base h-14 px-10 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300">
                <Link to="/auth?mode=signup" className="flex items-center gap-2">
                  Connect Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button asChild size="lg" className="text-base h-14 px-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300">
                <Link to="/home" className="flex items-center gap-2">
                  Connect
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Marquee */}
      <Marquee />

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Ways to Connect
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Choose your path and let our AI find the perfect matches for meaningful connections
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="h-full"
            >
              <LiquidCrystalCard className="p-8 h-full flex flex-col items-start text-left group rounded-3xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg backdrop-blur-md">
                  <Sparkles className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.5)]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                  Surprise me
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Let AI suggest diverse connections across all categories.
                </p>
              </LiquidCrystalCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="h-full"
            >
              <LiquidCrystalCard className="p-8 h-full flex flex-col items-start text-left group rounded-3xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg backdrop-blur-md">
                  <Users className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.5)]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                  Mentoring
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Get guidance from experienced students and alumni who share your goals.
                </p>
              </LiquidCrystalCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="h-full"
            >
              <LiquidCrystalCard className="p-8 h-full flex flex-col items-start text-left group rounded-3xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg backdrop-blur-md">
                  <Lightbulb className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.5)]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                  Co-founding
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Find co-founders with complementary skills for your next venture.
                </p>
              </LiquidCrystalCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Why Students Love icebreaker.ai
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-slate-800/60 hover:border-white/20 transition-all duration-300">
                <h3 className="font-semibold text-xl text-white mb-3">No Cold Outreach</h3>
                <p className="text-slate-400 leading-relaxed">We handle the introductions. Just show up and connect.</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-slate-800/60 hover:border-white/20 transition-all duration-300">
                <h3 className="font-semibold text-xl text-white mb-3">No Photo Bias</h3>
                <p className="text-slate-400 leading-relaxed">Matches based on interests and goals, not appearances.</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-slate-800/60 hover:border-white/20 transition-all duration-300">
                <h3 className="font-semibold text-xl text-white mb-3">Smart Scheduling</h3>
                <p className="text-slate-400 leading-relaxed">AI finds time slots that work for both people automatically.</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-slate-800/60 hover:border-white/20 transition-all duration-300">
                <h3 className="font-semibold text-xl text-white mb-3">Ice Breakers Included</h3>
                <p className="text-slate-400 leading-relaxed">Never run out of things to talk about with our conversation starters.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { StickyScroll } from "@/components/landing/StickyScroll";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  
  const y1 = useTransform(scrollY, [0, 3000], [0, 600]); 
  const y2 = useTransform(scrollY, [0, 3000], [0, -600]);
  const y3 = useTransform(scrollY, [0, 3000], [0, 300]);
  const rotate1 = useTransform(scrollY, [0, 3000], [0, 45]);
  const rotate2 = useTransform(scrollY, [0, 3000], [0, -45]);

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
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white selection:bg-cyan-500/30 overflow-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          style={{ y: y1, rotate: rotate1 }}
          className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-cyan-500/20 rounded-full blur-[120px] opacity-40"
        />
        
        <motion.div 
          style={{ y: y2, rotate: rotate2 }}
          className="absolute top-[30%] -right-[15%] w-[900px] h-[900px] bg-violet-600/20 rounded-full blur-[130px] opacity-40"
        />
        
        <motion.div 
          style={{ y: y3 }}
          className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-700/15 rounded-full blur-[140px] opacity-30"
        />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-slate-950/50 border-b border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="icebreaker.ai Logo" className="h-10 w-10 rounded-lg brightness-75" />
          <div className="text-xl font-bold tracking-tighter text-white">icebreaker.ai</div>
        </Link>
        {isAuthenticated ? (
          <button 
            onClick={() => navigate('/home')}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          >
            Dashboard
          </button>
        ) : (
          <Link to="/auth?mode=signin">
            <button className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-xs font-medium text-white hover:bg-white/20 transition-colors">
              Log In
            </button>
          </Link>
        )}
      </nav>

      <main className="relative z-10">
        <Hero />
        <Marquee />
        <StickyScroll />
        <BentoGrid />
        <Testimonials />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Index;

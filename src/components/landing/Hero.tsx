import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const Hero: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-32 pb-12">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
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
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-700/60 to-violet-600/60 rounded-full blur-[90px] mix-blend-screen" 
        />
        
        <motion.div 
          animate={{ 
            x: [-50, 50, -50],
            y: [-20, 20, -20],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-cyan-500/40 rounded-full blur-[70px] mix-blend-overlay" 
        />

        <motion.div 
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
          className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-indigo-500/50 rounded-full blur-[80px] mix-blend-color-dodge" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 mb-8"
      >
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md shadow-lg">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
          </div>
          <p className="text-xs text-slate-200">
            Limited early access for <span className="text-white font-bold">ISM University Community</span>.
          </p>
        </div>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="z-10 text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] drop-shadow-sm"
      >
        Network - minus the awkwardness
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="z-10 mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium"
      >
        AI that connects you, sets the meeting, and breaks the ice
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="z-10 mt-10 flex flex-col items-center mb-16"
      >
        <Link to={isAuthenticated ? "/home" : "/auth?mode=signup"}>
          <button className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-cyan-500/20">
            {isAuthenticated ? "Dashboard" : "Try Now"} <ArrowRight size={16} />
          </button>
        </Link>
      </motion.div>

    </section>
  );
};

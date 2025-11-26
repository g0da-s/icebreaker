import React from 'react';
import { LiquidCrystalCard } from './LiquidCrystalCard';
import { Users, Lightbulb, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const BentoGrid: React.FC = () => {
  const waysToConnect = [
    {
      title: "Surprise me",
      description: "Let AI suggest diverse connections across all categories.",
      icon: <Sparkles className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.5)]" />,
      delay: 0
    },
    {
      title: "Mentoring",
      description: "Get guidance from experienced students and alumni who share your goals.",
      icon: <Users className="w-8 h-8 text-blue-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.5)]" />,
      delay: 0.1
    },
    {
      title: "Co-founding",
      description: "Find co-founders with complementary skills for your next venture.",
      icon: <Lightbulb className="w-8 h-8 text-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.5)]" />,
      delay: 0.2
    }
  ];

  return (
    <section className="px-4 py-16 max-w-7xl mx-auto">
      <div className="mb-16 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-white mb-6"
        >
          Ways To Connect
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-300 max-w-2xl mx-auto text-lg"
        >
          Choose your path and let our AI find the perfect matches for meaningful connections
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {waysToConnect.map((way, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: way.delay }}
            className="h-full"
          >
            <LiquidCrystalCard className="p-8 h-full flex flex-col items-start text-left group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg backdrop-blur-md">
                    {way.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight drop-shadow-md">
                    {way.title}
                </h3>
                <p className="text-slate-200 font-medium leading-relaxed text-sm opacity-90">
                    {way.description}
                </p>
            </LiquidCrystalCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

import React from 'react';
import { Fingerprint, Sliders, Bot, MessageCircleHeart } from 'lucide-react';
import { GlassCard } from './GlassCard';

const steps = [
  {
    id: 0,
    title: "Create Profile",
    description: "Go beyond basic tags. Input your deep interests and values. Our AI analyzes the semantic nuance of your personality.",
    icon: <Fingerprint className="w-8 h-8 text-cyan-400" />
  },
  {
    id: 1,
    title: "Define Preferences",
    description: "Tell us your ideal setting - whether it's a quiet espresso bar or a vibrant art gallery. We prioritize your comfort.",
    icon: <Sliders className="w-8 h-8 text-violet-400" />
  },
  {
    id: 2,
    title: "AI Auto-Schedule",
    description: "Skip the scheduling fatigue. Our AI identifies your optimal match and automatically books a time and venue.",
    icon: <Bot className="w-8 h-8 text-blue-400" />
  },
  {
    id: 3,
    title: "Break the Ice",
    description: "You show up. We handle the rest. Your app unlocks custom conversation starters generated for your connection.",
    icon: <MessageCircleHeart className="w-8 h-8 text-pink-400" />
  }
];

export const StickyScroll: React.FC = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-400 tracking-tight">
            How to Icebreak
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-violet-500 mx-auto mt-6 rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {steps.map((step, index) => (
            <GlassCard key={step.id} className="p-8 flex items-center justify-between group border-white/10 hover:border-cyan-500/30 transition-all duration-300 bg-slate-900/80">
               <div className="text-6xl font-black text-white/5 mr-8 select-none">
                 0{index + 1}
               </div>

               <div className="flex flex-1 items-center gap-6">
                 <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/10 items-center justify-center text-white shadow-inner shadow-white/5">
                    {step.icon}
                 </div>
                 
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="md:hidden text-cyan-400">{step.icon}</span>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{step.title}</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-medium">
                      {step.description}
                    </p>
                 </div>
               </div>
            </GlassCard>
          ))}
        </div>
    </section>
  );
};

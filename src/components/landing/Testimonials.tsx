import React from 'react';
import { GlassCard } from './GlassCard';

const testimonials = [
  {
    id: 1,
    name: "Maria T.",
    role: "Entrepreneur",
    quote: "Found a co-founder with exactly the drive and complementary skills I needed. We launched in 3 months.",
    avatar: "https://picsum.photos/id/48/100/100"
  },
  {
    id: 2,
    name: "Alex R.",
    role: "Designer",
    quote: "Every match felt intentional. No wasted coffee meetings. Just meaningful conversations.",
    avatar: "https://picsum.photos/id/65/100/100"
  },
  {
    id: 3,
    name: "Sarah L.",
    role: "Neurologist",
    quote: "Efficient. Safe. High signal. It's the only networking tool I use now.",
    avatar: "https://picsum.photos/id/64/100/100"
  },
  {
    id: 4,
    name: "James K.",
    role: "Software Engineer",
    quote: "Found my co-founder in 2 weeks. The AI understood our complementary skills perfectly.",
    avatar: "https://picsum.photos/id/60/100/100"
  },
  {
    id: 5,
    name: "Aisha M.",
    role: "Visual Artist",
    quote: "Finally, a platform that values deep conversation over surface-level small talk.",
    avatar: "https://picsum.photos/id/40/100/100"
  },
  {
    id: 6,
    name: "David B.",
    role: "Researcher",
    quote: "The icebreaker questions were spot-on. Conversations flowed naturally from the first minute.",
    avatar: "https://picsum.photos/id/100/100/100"
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 overflow-hidden relative">
      
      <div className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none">
        <div className="w-[600px] md:w-[900px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute top-0 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>

      <div className="text-center mb-16 relative z-10 px-4 mt-12">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Member Stories
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base lg:text-lg">
            Real connections made by real people.
          </p>
      </div>

      <div className="relative w-full overflow-hidden group">
        <div className="absolute top-0 left-0 z-10 w-24 md:w-32 h-full bg-gradient-to-r from-slate-950 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 z-10 w-24 md:w-32 h-full bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />

        <div className="flex w-max animate-scroll-cards">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div key={`${t.id}-${i}`} className="w-[300px] md:w-[350px] mx-4">
              <GlassCard hoverEffect={true} className="p-8 h-full flex flex-col justify-between">
                <div className="mb-6">
                  <div className="text-4xl text-cyan-500/20 font-serif leading-none mb-2">"</div>
                  <p className="text-slate-200 leading-relaxed font-medium relative z-10 text-xs md:text-sm">
                    {t.quote}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                  <div>
                    <h4 className="text-white text-sm font-semibold">{t.name}</h4>
                    <p className="text-cyan-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-cards {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-cards {
          animation: scroll-cards 60s linear infinite;
        }
        .animate-scroll-cards:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

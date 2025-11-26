import React from 'react';

const interests = [
  { id: 0, label: "Quantum Computing" },
  { id: 1, label: "Generative AI" },
  { id: 2, label: "Minimalist Design" },
  { id: 3, label: "Espresso Brewing" },
  { id: 4, label: "High-Altitude Alpinism" },
  { id: 5, label: "Synthesizers" },
  { id: 6, label: "Stoic Philosophy" },
  { id: 7, label: "DeFi Protocols" },
  { id: 8, label: "Film Photography" },
  { id: 9, label: "Sustainable Urbanism" },
  { id: 10, label: "Biohacking" },
];

export const Marquee: React.FC = () => {
  const spinningItems = ["Quantum Computing", "Generative AI", "Minimalist Design", "Espresso Brewing"];
  
  return (
    <div className="relative w-full overflow-hidden py-12 bg-transparent border-y border-white/10">
      <div className="absolute top-0 left-0 z-10 w-32 h-full bg-gradient-to-r from-slate-950 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 z-10 w-32 h-full bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />

      <div className="flex w-max animate-scroll">
        {[...interests, ...interests, ...interests].map((interest, index) => {
          const isSpinning = spinningItems.includes(interest.label);
          return (
            <div 
              key={`${interest.id}-${index}`} 
              className="flex items-center mx-8 group cursor-default"
            >
              <span className={`text-slate-400 font-medium text-sm uppercase tracking-widest group-hover:text-cyan-400 transition-colors duration-300 ${isSpinning ? 'animate-spin-slow' : ''}`}>
                {interest.label}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700 ml-16 group-hover:bg-cyan-500 transition-colors" />
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

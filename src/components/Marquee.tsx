import React from 'react';

const interests = [
  { id: 1, label: "AI & Machine Learning" },
  { id: 2, label: "Quantum Computing" },
  { id: 3, label: "Sustainable Tech" },
  { id: 4, label: "Blockchain" },
  { id: 5, label: "Design Systems" },
  { id: 6, label: "Biotech" },
  { id: 7, label: "EdTech" },
  { id: 8, label: "FinTech" },
  { id: 9, label: "HealthTech" },
  { id: 10, label: "Space Exploration" },
  { id: 11, label: "Web3" },
  { id: 12, label: "AR/VR" }
];

export const Marquee: React.FC = () => {
  const tripled = [...interests, ...interests, ...interests];

  return (
    <div className="relative w-full py-8 bg-slate-950/40 backdrop-blur-sm border-y border-white/5 overflow-hidden">
      <div className="flex animate-[scroll_40s_linear_infinite] hover:pause">
        {tripled.map((interest, index) => (
          <div 
            key={`${interest.id}-${index}`} 
            className="flex items-center mx-8 group cursor-default"
          >
            <span className="text-slate-400 font-medium text-sm uppercase tracking-widest group-hover:text-cyan-400 transition-colors duration-300">
              {interest.label}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700 ml-16 group-hover:bg-cyan-500 transition-colors" />
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
};

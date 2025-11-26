import React from 'react';

interface LiquidCrystalCardProps {
  children: React.ReactNode;
  className?: string;
}

export const LiquidCrystalCard: React.FC<LiquidCrystalCardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`
        relative overflow-hidden group
        bg-gradient-to-br from-slate-800/60 via-slate-900/50 to-slate-950/80
        backdrop-blur-2xl
        border border-white/10
        shadow-2xl
        hover:shadow-cyan-500/20
        transition-all duration-700 ease-out
        hover:border-white/20
        hover:scale-[1.02]
        ${className}
      `}
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(30, 41, 59, 0.6) 0%, 
            rgba(15, 23, 42, 0.5) 50%, 
            rgba(2, 6, 23, 0.8) 100%
          )
        `
      }}
    >
      {/* Glossy Specular Highlight */}
      <div 
        className="absolute inset-0 rounded-[32px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(80% 60% at 50% -10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)'
        }}
      />

      {/* Surface Noise/Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Internal Liquid Glow on Hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 60%)'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div 
      className={`
        relative overflow-hidden 
        bg-slate-800/40 backdrop-blur-xl 
        border border-white/10 
        shadow-xl
        rounded-2xl 
        transition-all duration-300
        ${hoverEffect ? 'hover:bg-slate-800/60 hover:border-white/20 hover:scale-[1.01] hover:shadow-cyan-500/10' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

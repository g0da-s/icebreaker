import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden 
        bg-slate-800/40 backdrop-blur-xl 
        border border-white/10 
        shadow-xl
        rounded-2xl 
        transition-all duration-300
        ${hoverEffect ? 'hover:bg-slate-800/60 hover:border-white/20 hover:scale-[1.01] hover:shadow-cyan-500/10' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

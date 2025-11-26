import React from 'react';

interface LiquidCrystalCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const LiquidCrystalCard: React.FC<LiquidCrystalCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative group
        rounded-[32px] 
        bg-gradient-to-br from-white/10 to-white/0
        backdrop-blur-2xl
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        cursor-pointer
        ${className}
      `}
      style={{
        boxShadow: `
          inset 0 0 0 1px rgba(255, 255, 255, 0.15), 
          inset 0 1px 0 0 rgba(255, 255, 255, 0.4), 
          inset 0 -1px 0 0 rgba(255, 255, 255, 0.05),
          inset 0 20px 40px -10px rgba(0, 0, 0, 0.2),
          0 20px 50px -10px rgba(0, 0, 0, 0.5),
          0 10px 20px -5px rgba(0, 0, 0, 0.3)
        `
      }}
    >
      <div 
        className="absolute inset-0 rounded-[32px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(80% 60% at 50% -10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)'
        }}
      />

      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06), transparent 40%)'
        }}
      />

      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};

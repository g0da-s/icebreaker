import React from 'react';
export const Footer: React.FC = () => {
  return <footer className="w-full border-t border-white/10 py-12 bg-slate-950/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">icebreaker.ai</h2>
            <p className="text-xs text-slate-400">© 2025 Icebreaker Inc. All rights reserved.</p>
        </div>
        
        <div className="flex gap-8 text-sm text-slate-400">
            <a href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-cyan-400 transition-colors">Terms</a>
        </div>
      </div>
    </footer>;
};
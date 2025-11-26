import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function BottomNav() {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Calendar, label: "Meetings", path: "/meetings" },
    { icon: Trophy, label: "Achievements", path: "/achievements" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.path === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  const handleNavClick = () => {
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Subtle click sound effect
    const audio = new Audio();
    audio.volume = 0.2;
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OahUBELTKXh8bllHAU7k9nyx3ElBSl+zPDajzsKFmO96+mmVBELSKDf8blpIAU=';
    audio.play().catch(() => {});
  };

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="relative bg-slate-900/30 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl px-4 py-3">
        {/* Animated Bubble Indicator */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 left-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/40 via-blue-500/40 to-purple-500/40 backdrop-blur-sm z-0"
          animate={{
            x: activeIndex * 56 + 16,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          style={{
            boxShadow: "0 0 20px rgba(96, 165, 250, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)",
          }}
        />

        {/* Trail Effect */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 left-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-300/20 via-blue-400/20 to-purple-400/20 z-0"
          animate={{
            x: activeIndex * 56 + 16,
            opacity: [0.5, 0],
            scale: [1, 1.3],
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
          key={activeIndex}
        />

        <div className="flex items-center gap-2 relative z-10">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full transition-all relative",
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                )}
                aria-label={item.label}
              >
                <item.icon className="w-5 h-5 relative z-10" />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

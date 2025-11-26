import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock as ClockIcon } from "lucide-react";

export const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 bg-slate-900/40 backdrop-blur-xl border-2 border-white/20 rounded-2xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <ClockIcon className="w-5 h-5 text-primary relative z-10" />
        </div>
        <div className="text-sm border-l-2 border-white/10 pl-3">
          <div className="font-semibold text-white">
            {format(currentTime, "h:mm:ss a")}
          </div>
          <div className="text-xs text-white/60">
            {format(currentTime, "EEEE, MMM d, yyyy")}
          </div>
        </div>
      </div>
    </div>
  );
};

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
    <div className="fixed top-4 left-4 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <ClockIcon className="w-4 h-4 text-primary" />
        <div className="text-sm">
          <div className="font-semibold text-foreground">
            {format(currentTime, "h:mm:ss a")}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(currentTime, "EEEE, MMM d, yyyy")}
          </div>
        </div>
      </div>
    </div>
  );
};

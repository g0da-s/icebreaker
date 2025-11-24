import { useState, useEffect } from "react";
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";

type MeetingCountdownProps = {
  scheduledAt: string;
};

export const MeetingCountdown = ({ scheduledAt }: MeetingCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const meetingDate = new Date(scheduledAt);
      
      const days = differenceInDays(meetingDate, now);
      const hours = differenceInHours(meetingDate, now) % 24;
      const minutes = differenceInMinutes(meetingDate, now) % 60;
      const seconds = differenceInSeconds(meetingDate, now) % 60;

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else if (seconds > 0) {
        setTimeLeft(`${seconds}s`);
      } else {
        setTimeLeft("Meeting time!");
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [scheduledAt]);

  return (
    <div className="text-sm font-semibold text-primary">
      {timeLeft}
    </div>
  );
};

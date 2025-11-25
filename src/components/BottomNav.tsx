import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Calendar, label: "Meetings", path: "/meetings" },
    { icon: Trophy, label: "Achievements", path: "/achievements" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card/90 backdrop-blur-lg border border-border rounded-full shadow-lg px-4 py-3">
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-label={item.label}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="icebreaker.ai Logo" className="h-10 w-10 rounded-lg" />
          <span className="font-bold text-xl text-foreground">icebreaker.ai</span>
        </Link>

        {!isAuthenticated && (
          <Button asChild variant="ghost" className="hidden sm:flex bg-transparent hover:bg-accent/50 border border-foreground">
            <Link to="/auth?mode=signin">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
};
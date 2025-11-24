import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
export const Header = () => {
  return <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/icon-192.png" alt="icebeaker.ai Logo" className="h-10 w-10 rounded-lg" />
          <span className="font-bold text-xl text-foreground">icebreaker.ai</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:flex">
            <Link to="/auth">Sign Up for Early Access</Link>
          </Button>
          
          {/* Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background">
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Home
                </Link>
                <Link to="/matches" className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Matches
                </Link>
                <Link to="/messages" className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Messages
                </Link>
                <Link to="/profile" className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Profile
                </Link>
                <Link to="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Dashboard
                </Link>
                <Button asChild className="mt-4">
                  <Link to="/auth">Sign Up for Early Access</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>;
};
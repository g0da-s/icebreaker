import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-xl text-foreground">
            ISM Connect
          </Link>
          
          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/matches" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Matches
            </Link>
            <Link to="/messages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Messages
            </Link>
            <Link to="/profile" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Profile
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button asChild className="hidden sm:flex">
            <Link to="/auth">Sign Up for Early Access</Link>
          </Button>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
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
                <Button asChild className="mt-4">
                  <Link to="/auth">Sign Up for Early Access</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

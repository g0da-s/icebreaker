import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Lightbulb, Sparkles, Calendar, LogOut, User, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-muted-foreground">
              Choose how you'd like to connect today
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <MeetingTypeCard
              icon={<Heart className="w-8 h-8" />}
              title="Friendly Meeting"
              description="Meet someone with shared interests for a casual conversation"
              onClick={() => navigate("/match/friendly")}
              color="text-pink-500"
            />
            <MeetingTypeCard
              icon={<Users className="w-8 h-8" />}
              title="Find a Mentor"
              description="Get guidance from experienced students or alumni"
              onClick={() => navigate("/match/mentor")}
              color="text-blue-500"
            />
            <MeetingTypeCard
              icon={<Lightbulb className="w-8 h-8" />}
              title="Find Co-founder"
              description="Connect with potential business partners"
              onClick={() => navigate("/match/cofounder")}
              color="text-yellow-500"
            />
            <MeetingTypeCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Not Sure?"
              description="Let AI suggest the best matches for you"
              onClick={() => navigate("/match/explore")}
              color="text-purple-500"
            />
          </div>

          {/* Upcoming Meetings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Meetings
              </CardTitle>
              <CardDescription>
                Your scheduled connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming meetings yet</p>
                <p className="text-sm mt-2">Start matching to schedule your first meeting!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const MeetingTypeCard = ({
  icon,
  title,
  description,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) => (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
    <CardHeader>
      <div className={`${color} mb-2 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Button variant="outline" className="w-full">
        Get Started
      </Button>
    </CardContent>
  </Card>
);

export default Dashboard;

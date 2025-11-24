import MobileLayout from "@/components/MobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Calendar, LogOut, Edit, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  // Mock user data - will be replaced with real data from Supabase
  const user = {
    name: "John Doe",
    email: "john.doe@ism.lt",
    role: "Student",
    tags: ["Tech", "Entrepreneurship", "Design", "Marketing"],
    calendlyUrl: "https://calendly.com/johndoe",
    meetingTypes: ["Friendly", "Co-founding"],
  };

  return (
    <MobileLayout>
      <div className="container max-w-screen-sm mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        {/* Profile Header */}
        <Card className="p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {user.name}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="secondary" className="mt-1">
                  {user.role}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/profile-setup">
                <Edit className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Interests & Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Meeting Preferences
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.meetingTypes.map((type) => (
                  <Badge key={type}>{type}</Badge>
                ))}
              </div>
            </div>

            {user.calendlyUrl && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Scheduling
                </h3>
                <Button variant="outline" size="sm" className="h-10" asChild>
                  <a
                    href={user.calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Calendly
                  </a>
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Settings Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 justify-start"
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Profile;

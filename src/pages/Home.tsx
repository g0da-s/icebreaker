import { useNavigate } from "react-router-dom";
import { Heart, Users, Lightbulb, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";

const Home = () => {
  const navigate = useNavigate();

  const meetingTypes = [
    {
      icon: Heart,
      title: "Friendly Meetings",
      description: "Meet someone with shared hobbies and interests for a casual conversation",
      color: "text-pink-500",
      path: "/match/friendly"
    },
    {
      icon: Users,
      title: "Mentoring",
      description: "Get guidance and expertise from experienced students or alumni",
      color: "text-blue-500",
      path: "/match/mentor"
    },
    {
      icon: Lightbulb,
      title: "Co-founding",
      description: "Connect with potential business partners with complementary skills",
      color: "text-yellow-500",
      path: "/match/cofounder"
    },
    {
      icon: Sparkles,
      title: "I Am Not Sure",
      description: "Let AI suggest the best diverse matches across all categories for you",
      color: "text-purple-500",
      path: "/match/explore"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Choose Your Connection Type
            </h1>
            <p className="text-muted-foreground">
              Select how you'd like to connect today
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {meetingTypes.map((type) => (
              <Card 
                key={type.path}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(type.path)}
              >
                <CardHeader>
                  <div className={`${type.color} mb-3 group-hover:scale-110 transition-transform`}>
                    <type.icon className="w-12 h-12" />
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <CardDescription className="text-base">{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
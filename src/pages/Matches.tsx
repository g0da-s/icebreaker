import MobileLayout from "@/components/MobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Lightbulb, Users, Calendar } from "lucide-react";

const Matches = () => {
  // Mock data - will be replaced with real data from Supabase
  const dailyMatches = [
    {
      id: 1,
      name: "Alex Johnson",
      matchType: "Friendly",
      tags: ["Coding", "Startups", "Coffee"],
      bio: "Looking to connect with fellow ISM students interested in tech!",
    },
    {
      id: 2,
      name: "Maria Silva",
      matchType: "Mentoring",
      tags: ["Marketing", "Career Growth", "Leadership"],
      bio: "MBA graduate willing to mentor students on career development.",
    },
    {
      id: 3,
      name: "Tom Williams",
      matchType: "Co-founding",
      tags: ["Product Design", "UI/UX", "SaaS"],
      bio: "Designer seeking technical co-founder for EdTech startup.",
    },
  ];

  const getMatchIcon = (type: string) => {
    switch (type) {
      case "Friendly":
        return <Heart className="w-4 h-4" />;
      case "Mentoring":
        return <Lightbulb className="w-4 h-4" />;
      case "Co-founding":
        return <Users className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <MobileLayout>
      <div className="container max-w-screen-sm mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Today's Matches
          </h1>
          <p className="text-muted-foreground">
            3 suggested connections based on your interests
          </p>
        </div>

        <div className="space-y-4">
          {dailyMatches.map((match) => (
            <Card key={match.id} className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {match.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">
                    {match.name}
                  </h3>
                  <Badge variant="outline" className="mt-1">
                    {getMatchIcon(match.matchType)}
                    <span className="ml-1">{match.matchType}</span>
                  </Badge>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-3">{match.bio}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {match.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12"
                  onClick={() => console.log("Skip", match.id)}
                >
                  <X className="w-5 h-5 mr-2" />
                  Skip
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-12"
                  onClick={() => console.log("Connect", match.id)}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Connect
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Matches;

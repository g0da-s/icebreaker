import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, RefreshCw, Calendar, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - will be replaced with real AI matching
const MOCK_MATCHES = {
  friendly: [
    {
      id: "1",
      name: "Anna Petrova",
      commonInterests: ["Technology", "Reading", "Travel"],
      bio: "Masters student passionate about AI and literature",
    },
    {
      id: "2",
      name: "Lukas Jankauskas",
      commonInterests: ["Sports", "Music", "Photography"],
      bio: "Final year student, loves hiking and indie music",
    },
    {
      id: "3",
      name: "Emma Wilson",
      commonInterests: ["Cooking", "Film", "Art"],
      bio: "Exchange student from UK, foodie and cinema enthusiast",
    },
  ],
  mentor: [
    {
      id: "4",
      name: "Dr. Mantas Vilkas",
      expertise: ["Marketing", "Strategy", "Product Management"],
      bio: "Alumni, now CMO at tech startup",
      linkedin: "https://linkedin.com/in/mantasvilkas",
    },
    {
      id: "5",
      name: "Gabija Kazlauskaite",
      expertise: ["Finance", "Data Analysis", "Operations"],
      bio: "Masters student, 5 years experience in fintech",
      linkedin: "https://linkedin.com/in/gabijakazlauskaite",
    },
  ],
  cofounder: [
    {
      id: "6",
      name: "Tomas Simonaitis",
      skills: ["Programming", "Technical Writing", "Problem Solving"],
      bio: "Looking for business co-founder for SaaS idea",
      interests: ["B2B Software", "Automation", "AI"],
    },
    {
      id: "7",
      name: "Ieva Noreika",
      skills: ["Design", "Marketing", "Communication"],
      bio: "Designer seeking technical co-founder",
      interests: ["E-commerce", "Sustainability", "Fashion Tech"],
    },
  ],
  explore: [
    {
      id: "8",
      name: "Mixed Match 1",
      type: "Friendly",
      commonInterests: ["Gaming", "Technology"],
      bio: "Fellow tech enthusiast looking to connect",
    },
    {
      id: "9",
      name: "Mixed Match 2",
      type: "Mentor",
      expertise: ["Leadership", "Sales"],
      bio: "Can help with career guidance",
    },
  ],
};

const Match = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getTitle = () => {
    switch (type) {
      case "friendly":
        return "Friendly Matches";
      case "mentor":
        return "Mentor Matches";
      case "cofounder":
        return "Co-founder Matches";
      case "explore":
        return "Explore Matches";
      default:
        return "Matches";
    }
  };

  const matches = MOCK_MATCHES[type as keyof typeof MOCK_MATCHES] || [];

  const handleRefresh = () => {
    setIsLoading(true);
    // TODO: Call AI matching algorithm
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "New matches found!",
        description: "Showing fresh suggestions for you",
      });
    }, 1500);
  };

  const handleSchedule = (matchName: string) => {
    toast({
      title: "Opening calendar...",
      description: `Finding time slots with ${matchName}`,
    });
    // TODO: Integrate with calendar API
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{getTitle()}</h1>
              <p className="text-muted-foreground">
                AI-selected matches based on your profile
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {matches.map((match: any) => (
              <Card key={match.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{match.name}</CardTitle>
                      <CardDescription className="text-base">
                        {match.bio}
                      </CardDescription>
                    </div>
                    {match.linkedin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(match.linkedin, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {match.commonInterests && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Common Interests
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {match.commonInterests.map((interest: string) => (
                          <Badge key={interest} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.expertise && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Expertise
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {match.expertise.map((exp: string) => (
                          <Badge key={exp} variant="secondary">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.skills && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {match.skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.interests && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Interested In
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {match.interests.map((interest: string) => (
                          <Badge key={interest} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => handleSchedule(match.name)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
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

export default Match;

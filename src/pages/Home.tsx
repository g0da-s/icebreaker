import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Heart, Users, Lightbulb, Sparkles, Search, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Match {
  user_id: string;
  full_name: string;
  email: string;
  tags: string[];
  match_score: number;
  reason: string;
  earliest_available?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a search query",
        description: "Tell us what you're looking for",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-match', {
        body: { searchQuery, userId }
      });

      if (error) throw error;

      setMatches(data.matches || []);
      
      if (data.matches?.length === 0) {
        toast({
          title: "No matches found",
          description: "Try a different search or adjust your interests",
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* AI Search Section */}
          <div className="mb-12">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Find Your Perfect Match
              </h1>
              <p className="text-muted-foreground">
                Tell us what you're looking for
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                placeholder="E.g., 'looking for a co-founder with tech skills' or 'want to meet someone who loves photography'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 h-12 text-base"
              />
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                size="lg"
                className="h-12"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Quick search buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { 
                  setSearchQuery("friendly meeting"); 
                  setTimeout(handleSearch, 100);
                }}
              >
                <Heart className="w-4 h-4 mr-2" />
                Friendly
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { 
                  setSearchQuery("mentor"); 
                  setTimeout(handleSearch, 100);
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Mentor
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { 
                  setSearchQuery("co-founder"); 
                  setTimeout(handleSearch, 100);
                }}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Co-founder
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { 
                  setSearchQuery("surprise me"); 
                  setTimeout(handleSearch, 100);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Surprise Me
              </Button>
            </div>
          </div>

          {/* Match Results */}
          {matches.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Your Matches
              </h2>
              <div className="space-y-4">
                {matches.map((match) => (
                  <Card key={match.user_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl">{match.full_name}</CardTitle>
                            <Badge variant="default">
                              {match.match_score}% match
                            </Badge>
                          </div>
                          <CardDescription>{match.email}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                          {match.reason}
                        </p>
                        
                        {match.tags && match.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {match.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {match.earliest_available || "Availability not set"}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1">
                            Schedule Meeting
                          </Button>
                          <Button variant="outline">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;

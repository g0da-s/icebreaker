import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, Heart, Lightbulb, Sparkles, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Match {
  user_id: string;
  full_name: string;
  email: string;
  tags: string[];
  match_score: number;
  reason: string;
}

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const { toast } = useToast();

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
          description: "Try a different search or invite more people to join",
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-foreground">ISM Connect</h1>
            </div>
            <Link to="/profile">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        
        <div className="relative container mx-auto px-4 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI-Powered Matching</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Find Your Perfect
              <span className="text-primary"> Connection</span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Tell us what you are looking for and let AI find the best matches based on interests and availability
            </p>
            
            {/* AI Search */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-12">
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

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery("friendly meeting"); handleSearch(); }}>
                <Heart className="w-4 h-4 mr-2" />
                Friendly
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery("mentor"); handleSearch(); }}>
                <Users className="w-4 h-4 mr-2" />
                Mentor
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery("co-founder"); handleSearch(); }}>
                <Lightbulb className="w-4 h-4 mr-2" />
                Co-founder
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery("surprise me"); handleSearch(); }}>
                <Sparkles className="w-4 h-4 mr-2" />
                Surprise
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Matches Section */}
      {matches.length > 0 && (
        <section className="py-12 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Your Matches
              </h2>
              
              <div className="space-y-4">
                {matches.map((match) => (
                  <Card key={match.user_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{match.full_name}</CardTitle>
                          <CardDescription>{match.email}</CardDescription>
                        </div>
                        <Badge variant="default" className="ml-2">
                          {match.match_score}% match
                        </Badge>
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

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Earliest available: Coming soon</span>
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
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
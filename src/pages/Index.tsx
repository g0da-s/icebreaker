import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Heart, Lightbulb, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
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
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        
        <div className="relative container mx-auto px-4 py-20 sm:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Currently exclusive only for ISM</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Connect Without the
              <span className="text-primary"> Pressure</span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              AI-powered matching for ISM students. Find friends, mentors, and co-founders based on shared interests-not appearances.
            </p>
            
            {!isAuthenticated ? (
              <div className="flex flex-col gap-3 justify-center max-w-xs mx-auto sm:max-w-none sm:flex-row sm:gap-4">
                <Button asChild size="lg" className="text-base h-12">
                  <Link to="/auth?mode=signup">Register</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base h-12">
                  <Link to="/auth?mode=signin">Sign In</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg text-foreground font-medium">Welcome back!</p>
                <Button asChild size="lg" className="text-base h-12">
                  <Link to="/profile">Edit My Profile</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Four Ways to Connect
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose your path and let our AI find the perfect matches for meaningful connections
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Friendly Meetings"
              description="Meet new people with shared interests. Random or smart matches available."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Mentoring"
              description="Get guidance from experienced students and alumni who share your goals."
            />
            <FeatureCard
              icon={<Lightbulb className="w-8 h-8" />}
              title="Co-founding"
              description="Find co-founders with complementary skills for your next venture."
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Not Sure?"
              description="Let AI suggest diverse connections across all categories."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Why Students Love icebeaker.ai
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <BenefitCard
                title="No Cold Outreach"
                description="We handle the introductions. Just show up and connect."
              />
              <BenefitCard
                title="No Photo Bias"
                description="Matches based on interests and goals, not appearances."
              />
              <BenefitCard
                title="Smart Scheduling"
                description="AI finds time slots that work for both people automatically."
              />
              <BenefitCard
                title="Ice Breakers Included"
                description="Never run out of things to talk about with our conversation starters."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Make Meaningful Connections?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join your fellow ISM students and start building your network today
          </p>
          <Button asChild size="lg" className="text-base">
            <Link to="/auth?mode=signup">Join Now with ISM Email</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-background border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
    <div className="text-primary mb-4">{icon}</div>
    <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

const BenefitCard = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-card border border-border rounded-lg p-6">
    <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;

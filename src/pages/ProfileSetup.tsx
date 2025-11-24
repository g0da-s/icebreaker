import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const INTERESTS = [
  "Sports", "Music", "Art", "Technology", "Reading", "Travel",
  "Cooking", "Photography", "Gaming", "Film", "Fashion", "Fitness"
];

const EXPERTISE = [
  "Marketing", "Finance", "Programming", "Design", "Sales", "Strategy",
  "Data Analysis", "Product Management", "Operations", "HR", "Legal", "Research"
];

const SKILLS = [
  "Leadership", "Communication", "Problem Solving", "Creativity", "Teamwork",
  "Technical Writing", "Public Speaking", "Project Management", "Negotiation"
];

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const progress = (step / 4) * 100;

  // Check if user is editing existing profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        const { data: interests } = await supabase
          .from('user_interests')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (interests) {
          setIsEditing(true);
          setSelectedInterests(interests.tags?.slice(0, INTERESTS.length) || []);
          setSelectedExpertise(interests.tags?.slice(INTERESTS.length, INTERESTS.length + EXPERTISE.length) || []);
          setSelectedSkills(interests.tags?.slice(INTERESTS.length + EXPERTISE.length) || []);
          setLinkedinUrl(interests.linkedin_url || "");
          setBio(interests.bio || "");
        }
      } catch (error: any) {
        console.error("Error checking profile:", error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingProfile();
  }, [navigate]);

  const toggleTag = (tag: string, list: string[], setter: (tags: string[]) => void) => {
    if (list.includes(tag)) {
      setter(list.filter(t => t !== tag));
    } else {
      setter([...list, tag]);
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedInterests.length === 0) {
      toast({
        title: "Select at least one interest",
        description: "This helps us find better matches for you",
        variant: "destructive",
      });
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "Please log in first",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Combine all tags into one array
      const allTags = [...selectedInterests, ...selectedExpertise, ...selectedSkills];

      if (isEditing) {
        // Update existing profile
        const { error } = await supabase
          .from('user_interests')
          .update({
            tags: allTags,
            bio: bio || null,
            linkedin_url: linkedinUrl || null,
          })
          .eq('user_id', session.user.id);

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Profile Updated!",
            description: "Your profile has been updated successfully",
          });
          navigate("/profile");
        }
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('user_interests')
          .insert({
            user_id: session.user.id,
            tags: allTags,
            bio: bio || null,
            linkedin_url: linkedinUrl || null,
          });

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Profile Created!",
            description: "Let's find your first match",
          });
          navigate("/home");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Link to="/home" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
      </div>
      
      {loading ? (
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="space-y-2">
              <CardTitle>{isEditing ? "Edit Your Profile" : "Build Your Profile"}</CardTitle>
              <CardDescription>
                Step {step} of 4 - This helps us find the perfect matches for you
              </CardDescription>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Interests & Hobbies
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select topics you're passionate about (for friendly meetings)
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(interest, selectedInterests, setSelectedInterests)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Expertise Areas
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  What can you mentor others in? (Optional but helpful)
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE.map(skill => (
                    <Badge
                      key={skill}
                      variant={selectedExpertise.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(skill, selectedExpertise, setSelectedExpertise)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Input
                  id="bio"
                  placeholder="Tell us about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile (Optional)</Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Skills & Goals
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select skills relevant for co-founding opportunities
                </p>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(skill => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(skill, selectedSkills, setSelectedSkills)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Review Your Profile
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedInterests.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  {selectedExpertise.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedExpertise.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSkills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {linkedinUrl && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">LinkedIn</p>
                      <p className="text-sm text-foreground">{linkedinUrl}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
                <Button onClick={handleComplete}>
                  {isEditing ? "Update Profile" : "Complete Profile"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default ProfileSetup;

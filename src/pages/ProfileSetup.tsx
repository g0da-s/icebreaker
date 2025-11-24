import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BottomNav } from "@/components/BottomNav";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STUDY_OPTIONS = ["Bachelor's", "Master's", "PhD", "Executive", "Alumni", "Faculty Member"];

const CREATIVE_INTERESTS = [
  "Photography", "Music", "Art", "Design", "Writing", "Dance", "Theater", "Cooking", "Crafts", "Fashion"
];

const LIFESTYLE_INTERESTS = [
  "Sports", "Fitness", "Travel", "Gaming", "Reading", "Hiking", "Yoga", "Running", "Cycling", "Swimming"
];

const AI_QUESTIONS = [
  "What brings you here today?",
  "If tomorrow felt completely free, what would you love to spend it doing?",
  "What's your short-term goal?",
  "What's your long-term goal?"
];

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1: Basic Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studies, setStudies] = useState("");
  const [birthDate, setBirthDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [avatarType, setAvatarType] = useState<"upload" | "mascot">("mascot");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [selectedMascot, setSelectedMascot] = useState("");

  // Step 4: Availability
  const [availability, setAvailability] = useState({
    monday: { active: false, start: "09:00", end: "17:00" },
    tuesday: { active: false, start: "09:00", end: "17:00" },
    wednesday: { active: false, start: "09:00", end: "17:00" },
    thursday: { active: false, start: "09:00", end: "17:00" },
    friday: { active: false, start: "09:00", end: "17:00" },
    saturday: { active: false, start: "09:00", end: "17:00" },
    sunday: { active: false, start: "09:00", end: "17:00" },
  });

  // Step 2: AI Chat
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [chatAnswers, setChatAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: "ai" | "user", text: string}>>([]);

  // Step 3: Interests
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const progress = (step / 4) * 100;

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch existing profile data
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch existing interests
        const { data: interestsData } = await supabase
          .from('user_interests')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // Pre-fill form fields with existing data
        if (profileData) {
          const nameParts = profileData.full_name?.split(' ') || [];
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setStudies(profileData.studies || '');
          setLocation(profileData.location || '');
          
          if (profileData.birth_date) {
            setBirthDate(new Date(profileData.birth_date));
          }
          
          if (profileData.avatar_type === 'upload' || profileData.avatar_type === 'mascot') {
            setAvatarType(profileData.avatar_type);
          }
          setSelectedMascot(profileData.avatar_url || '');
          
          // Parse and set availability
          if (profileData.availability && typeof profileData.availability === 'object' && !Array.isArray(profileData.availability)) {
            const availData = profileData.availability as any;
            const newAvailability = { ...availability };
            
            for (const day in newAvailability) {
              if (availData[day]) {
                newAvailability[day as keyof typeof availability] = {
                  active: availData[day].active || false,
                  start: availData[day].start || '09:00',
                  end: availData[day].end || '17:00',
                };
              }
            }
            setAvailability(newAvailability);
          }
          
          // Parse onboarding answers if they exist
          if (profileData.onboarding_answers && typeof profileData.onboarding_answers === 'object') {
            const answers = profileData.onboarding_answers as any;
            const answersArray = [
              answers.question1 || '',
              answers.question2 || '',
              answers.question3 || '',
              answers.question4 || ''
            ].filter((a: string) => a);
            
            if (answersArray.length > 0) {
              setChatAnswers(answersArray);
            }
          }
        }

        // Pre-fill interests
        if (interestsData?.tags) {
          setSelectedInterests(interestsData.tags);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    
    checkAuthAndLoadProfile();
  }, [navigate]);

  // Initialize chat when entering step 2
  useEffect(() => {
    if (step === 2 && chatHistory.length === 0) {
      setChatHistory([{ role: "ai", text: AI_QUESTIONS[0] }]);
    }
  }, [step, chatHistory.length]);

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName || !studies || !birthDate || !location) {
        toast({
          title: "Complete all fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      if (avatarType === "mascot" && !selectedMascot) {
        toast({
          title: "Select an avatar",
          description: "Please choose a mascot avatar",
          variant: "destructive",
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleChatSubmit = () => {
    if (!currentAnswer.trim()) return;

    const newHistory = [...chatHistory, { role: "user" as const, text: currentAnswer }];
    const newAnswers = [...chatAnswers, currentAnswer];
    setChatAnswers(newAnswers);
    setChatHistory(newHistory);
    setCurrentAnswer("");

    if (currentQuestion < AI_QUESTIONS.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setTimeout(() => {
        setChatHistory([...newHistory, { role: "ai", text: AI_QUESTIONS[nextQuestion] }]);
      }, 500);
    } else {
      // All questions answered
      setTimeout(() => {
        setStep(3);
      }, 500);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const filteredCreative = CREATIVE_INTERESTS.filter(i => 
    i.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredLifestyle = LIFESTYLE_INTERESTS.filter(i => 
    i.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleComplete = async () => {
    if (selectedInterests.length === 0) {
      toast({
        title: "Select at least one interest",
        description: "Please choose interests that match you",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Prepare onboarding answers
      const onboardingAnswers = {
        question1: chatAnswers[0] || "",
        question2: chatAnswers[1] || "",
        question3: chatAnswers[2] || "",
        question4: chatAnswers[3] || "",
      };

      // Prepare update object - only include fields that have values
      const profileUpdate: any = {};
      
      if (firstName && lastName) {
        profileUpdate.full_name = `${firstName} ${lastName}`;
      }
      if (studies) profileUpdate.studies = studies;
      if (birthDate) profileUpdate.birth_date = format(birthDate, "yyyy-MM-dd");
      if (location) profileUpdate.location = location;
      
      profileUpdate.avatar_type = avatarType;
      profileUpdate.avatar_url = avatarType === "mascot" ? selectedMascot : null;
      
      if (Object.keys(onboardingAnswers).some(key => onboardingAnswers[key as keyof typeof onboardingAnswers])) {
        profileUpdate.onboarding_answers = onboardingAnswers;
      }
      
      // Only update availability if at least one day is active
      const hasActiveAvailability = Object.values(availability).some(day => day.active);
      if (hasActiveAvailability) {
        profileUpdate.availability = availability;
      }

      // Update profile (not insert - the profile already exists from signup)
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Create or update user interests (only if interests are selected)
      if (selectedInterests.length > 0) {
        const { data: existingInterests } = await supabase
          .from('user_interests')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (existingInterests) {
          const { error: updateError } = await supabase
            .from('user_interests')
            .update({ tags: selectedInterests })
            .eq('user_id', session.user.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('user_interests')
            .insert({
              user_id: session.user.id,
              tags: selectedInterests,
            });
          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Profile Updated!",
        description: "Your changes have been saved",
      });
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4 pb-24">
      <div className="absolute top-4 left-4">
        <Link to="/home" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
      </div>
      
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-2">
            <CardTitle>Build Your Profile</CardTitle>
            <CardDescription>
              Step {step} of 4 - Let's get to know you
            </CardDescription>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Basic Identity */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studies">Studies *</Label>
                <Select value={studies} onValueChange={setStudies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your study level" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDY_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !birthDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? format(birthDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Vilnius, Lithuania"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Profile Picture *</Label>
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={avatarType === "upload" ? "default" : "outline"}
                    onClick={() => setAvatarType("upload")}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button
                    type="button"
                    variant={avatarType === "mascot" ? "default" : "outline"}
                    onClick={() => setAvatarType("mascot")}
                    className="flex-1"
                  >
                    Choose Avatar
                  </Button>
                </div>

                {avatarType === "upload" ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {["mascot-1", "mascot-2", "mascot-3", "mascot-4"].map((mascot) => (
                      <div
                        key={mascot}
                        onClick={() => setSelectedMascot(mascot)}
                        className={`aspect-square rounded-lg border-2 cursor-pointer flex items-center justify-center text-4xl ${
                          selectedMascot === mascot
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        🧊
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {/* Step 2: AI Chat Interface */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="h-96 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === "ai"
                          ? "bg-primary/10 text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit();
                    }
                  }}
                />
                <Button onClick={handleChatSubmit} disabled={!currentAnswer.trim()}>
                  Send
                </Button>
              </div>

              {currentQuestion === AI_QUESTIONS.length - 1 && chatAnswers.length === AI_QUESTIONS.length && (
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)}>Next</Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Interests & Skills */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search interests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Creative & Personal Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredCreative.map(interest => (
                      <Badge
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Activity & Lifestyle</h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredLifestyle.map(interest => (
                      <Badge
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
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

          {/* Step 4: Availability Scheduler */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Set Your Availability</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the days and times you're available to meet
                </p>

                {(Object.keys(availability) as Array<keyof typeof availability>).map((day) => (
                  <div key={day} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={day} className="text-base capitalize">
                        {day}
                      </Label>
                      <Switch
                        id={day}
                        checked={availability[day].active}
                        onCheckedChange={(checked) =>
                          setAvailability({
                            ...availability,
                            [day]: { ...availability[day], active: checked },
                          })
                        }
                      />
                    </div>

                    {availability[day].active && (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor={`${day}-start`} className="text-sm">
                            Start Time
                          </Label>
                          <Input
                            id={`${day}-start`}
                            type="time"
                            value={availability[day].start}
                            onChange={(e) =>
                              setAvailability({
                                ...availability,
                                [day]: { ...availability[day], start: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${day}-end`} className="text-sm">
                            End Time
                          </Label>
                          <Input
                            id={`${day}-end`}
                            type="time"
                            value={availability[day].end}
                            onChange={(e) =>
                              setAvailability({
                                ...availability,
                                [day]: { ...availability[day], end: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? "Saving..." : "Finish"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BottomNav />
    </div>
  );
};

export default ProfileSetup;

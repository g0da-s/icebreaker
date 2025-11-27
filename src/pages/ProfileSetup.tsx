import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Upload, Search, MessageSquare, User, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";
import { CalendarAvailability } from "@/components/CalendarAvailability";
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STUDY_LEVELS = ["Bachelor's", "Master's", "Executive", "Alumni", "Faculty Member"];

const BACHELORS_PROGRAMS = [
  "Economics and Politics",
  "Economics and Data Analytics",
  "Finance",
  "Entrepreneurship and Innovation",
  "International Business and Communication",
  "Business Management and Marketing"
];

const MASTERS_PROGRAMS = [
  "International Marketing and Management",
  "Financial Economics",
  "Business Sustainability Management",
  "Innovation and Technology Management",
  "Global Leadership and Strategy"
];

const EXECUTIVE_PROGRAMS = [
  "Executive MBA",
  "Master of Management",
  "LAB 4 Leaders"
];

const ALL_PROGRAMS = [
  ...BACHELORS_PROGRAMS,
  ...MASTERS_PROGRAMS,
  ...EXECUTIVE_PROGRAMS
];

const CREATIVE_INTERESTS = [
  "Photography", "Music", "Art", "Design", "Writing", "Dance", "Theater", "Cooking", "Crafts", "Fashion"
];

const LIFESTYLE_INTERESTS = [
  "Sports", "Fitness", "Travel", "Gaming", "Reading", "Hiking", "Yoga", "Running", "Cycling", "Swimming"
];

const AI_QUESTIONS = [
  "What qualities do you enjoy in the people you work or spend time with?",
  "What do you usually hope to get out of a first meeting - a friendly connection, idea exchange, or potential collaboration?",
  "When talking to someone new, what makes you feel at ease - shared interests, a friendly tone, or clear purpose?",
  "Anything else you would like to tell about yourself?"
];

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1: Basic Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [studies, setStudies] = useState("");
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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Step 3: Interests
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isStandardizing, setIsStandardizing] = useState(false);
  const [suggestedInterests, setSuggestedInterests] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  
  // Step 5: AI Availability
  const [availabilityText, setAvailabilityText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [showManualCalendar, setShowManualCalendar] = useState(false);

  const progress = (step / 5) * 100;

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load names from user metadata for first-time users
      const userMetadata = session.user.user_metadata;
      if (userMetadata?.first_name && userMetadata?.last_name) {
        setFirstName(userMetadata.first_name);
        setLastName(userMetadata.last_name);
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
          // Try to get names from user metadata first, then from profile
          if (userMetadata?.first_name && userMetadata?.last_name) {
            setFirstName(userMetadata.first_name);
            setLastName(userMetadata.last_name);
          } else {
            // Fall back to parsing full_name
            const nameParts = profileData.full_name?.split(' ') || [];
            setFirstName(nameParts[0] || '');
            setLastName(nameParts.slice(1).join(' ') || '');
          }
          
          // Parse studies to extract level and program
          const studiesValue = profileData.studies || '';
          if (studiesValue.includes(' - ')) {
            const [level, program] = studiesValue.split(' - ');
            setStudyLevel(level);
            setStudies(program);
          } else if (STUDY_LEVELS.includes(studiesValue)) {
            setStudyLevel(studiesValue);
            setStudies('');
          } else {
            setStudyLevel('');
            setStudies(studiesValue);
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

  // Initialize chat when entering step 3
  useEffect(() => {
    if (step === 3 && chatHistory.length === 0) {
      setChatHistory([{ role: "ai", text: AI_QUESTIONS[0] }]);
    }
  }, [step, chatHistory.length]);

  // Auto-scroll to bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const generateInterestSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const profileData = {
        name: `${firstName} ${lastName}`,
        studies,
        answers: {
          question1: chatAnswers[0],
          question2: chatAnswers[1],
          question3: chatAnswers[2],
          question4: chatAnswers[3]
        }
      };

      const { data, error } = await supabase.functions.invoke('generate-interest-suggestions', {
        body: { profileData }
      });

      if (error) throw error;
      
      setSuggestedInterests(data.suggestions || []);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Could not generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const parseAvailability = async () => {
    if (!availabilityText.trim()) {
      toast({
        title: "Enter availability",
        description: "Please describe your availability first",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-availability', {
        body: { text: availabilityText }
      });

      if (error) throw error;
      
      setAvailability(data.availability);
      toast({
        title: "Availability set",
        description: "Your schedule has been updated based on your description",
      });
    } catch (error) {
      console.error('Error parsing availability:', error);
      toast({
        title: "Error",
        description: "Could not parse availability. Please try manual entry.",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      setShowExitDialog(true);
    }
  };

  const handleExitConfirm = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!firstName || !lastName || !studyLevel) {
        toast({
          title: "Complete all fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      if (studyLevel !== "Faculty Member" && !studies) {
        toast({
          title: "Select your program",
          description: "Please choose your study program",
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
      
      // PHASE 2: Save avatar immediately after Step 1
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase
            .from('profiles')
            .update({
              full_name: `${firstName} ${lastName}`,
              studies: studyLevel === "Faculty Member" ? studyLevel : `${studyLevel} - ${studies}`,
              avatar_type: avatarType,
              avatar_url: avatarType === "mascot" ? selectedMascot : null,
            })
            .eq('id', session.user.id);
        }
      } catch (error) {
        console.error('Error saving initial profile:', error);
      }
    }
    setStep(step + 1);
  };

  const getAvailablePrograms = () => {
    switch (studyLevel) {
      case "Bachelor's":
        return BACHELORS_PROGRAMS;
      case "Master's":
        return MASTERS_PROGRAMS;
      case "Executive":
        return EXECUTIVE_PROGRAMS;
      case "Alumni":
        return ALL_PROGRAMS;
      default:
        return [];
    }
  };

  const handleChatSubmit = async () => {
    if (!currentAnswer.trim()) return;

    const newHistory = [...chatHistory, { role: "user" as const, text: currentAnswer }];
    const newAnswers = [...chatAnswers, currentAnswer];
    setChatAnswers(newAnswers);
    setChatHistory(newHistory);
    setCurrentAnswer("");

    // After 3 answers, generate AI summary
    if (newAnswers.length === 3) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.functions.invoke('generate-user-story', {
            body: {
              answers: newAnswers.slice(0, 3),
            }
          });
        }
      } catch (error) {
        console.error('Error generating user story:', error);
      }
    }

    // Move to next question if not at the end
    if (currentQuestion < AI_QUESTIONS.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setChatHistory([...newHistory, { role: "ai", text: AI_QUESTIONS[nextQuestion] }]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleAddCustomInterest = async () => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch || isStandardizing) return;

    // Check if it already exists in selected interests or predefined lists
    const allInterests = [...CREATIVE_INTERESTS, ...LIFESTYLE_INTERESTS, ...selectedInterests];
    if (allInterests.some(i => i.toLowerCase() === trimmedSearch.toLowerCase())) {
      toast({
        title: "Interest already exists",
        description: "This interest is already in your list",
        variant: "destructive",
      });
      return;
    }

    setIsStandardizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('standardize-interest', {
        body: { interest: trimmedSearch }
      });

      if (error) throw error;

      const standardized = data.standardized;
      setSelectedInterests([...selectedInterests, standardized]);
      setSearchTerm("");
      
      toast({
        title: "Interest added",
        description: `Added "${standardized}" to your interests`,
      });
    } catch (error) {
      console.error('Error standardizing interest:', error);
      toast({
        title: "Error",
        description: "Could not add custom interest",
        variant: "destructive",
      });
    } finally {
      setIsStandardizing(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomInterest();
    }
  };

  const filteredCreative = CREATIVE_INTERESTS.filter(i => 
    i.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredLifestyle = LIFESTYLE_INTERESTS.filter(i => 
    i.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasSearchResults = filteredCreative.length > 0 || filteredLifestyle.length > 0;
  const canAddCustom = searchTerm.trim() && !hasSearchResults;

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
      
      // Combine study level and program for storage
      if (studyLevel) {
        if (studyLevel === "Faculty Member") {
          profileUpdate.studies = studyLevel;
        } else if (studies) {
          profileUpdate.studies = `${studyLevel} - ${studies}`;
        } else {
          profileUpdate.studies = studyLevel;
        }
      }
      
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 pb-24 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            y: [0, 100, 0],
            rotate: [0, 45, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] opacity-40"
        />
        
        <motion.div 
          animate={{ 
            y: [0, -100, 0],
            rotate: [0, -45, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[30%] -right-[15%] w-[900px] h-[900px] bg-blue-500/20 rounded-full blur-[130px] opacity-40"
        />
        
        <motion.div 
          animate={{ y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-700/15 rounded-full blur-[140px] opacity-30"
        />
      </div>

      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Button>
      </div>
      
      <LiquidCrystalCard className="w-full max-w-2xl z-10">
        <div className="p-6">
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              {step === 1 && <User className="w-5 h-5 text-cyan-400" />}
              {step === 2 && <MessageSquare className="w-5 h-5 text-cyan-400" />}
              {step === 3 && <MessageSquare className="w-5 h-5 text-cyan-400" />}
              {step === 4 && <Sparkles className="w-5 h-5 text-cyan-400" />}
              {step === 5 && <CalendarIcon className="w-5 h-5 text-cyan-400" />}
              <h2 className="text-2xl font-bold text-white">
                {step === 3 ? "Let's get to know you" : "Build Your Profile"}
              </h2>
            </div>
            <p className="text-white/60 text-sm">
              Step {step} of 5 - Let's get to know you
            </p>
            <div className="relative">
              <Progress value={progress} className="h-2 bg-white/10" />
              <div 
                className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 transition-all duration-500 ease-out"
                style={{ 
                  width: `${progress}%`,
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.6), 0 0 30px rgba(6, 182, 212, 0.3)'
                }}
              />
            </div>
          </div>
          <div>
          <AnimatePresence mode="wait">
          {/* Step 1: Basic Identity */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studyLevel" className="text-white">Study Level *</Label>
                <Select value={studyLevel} onValueChange={(value) => {
                  setStudyLevel(value);
                  setStudies("");
                }}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select your study level" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 z-50">
                    {STUDY_LEVELS.map(option => (
                      <SelectItem key={option} value={option} className="text-white">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {studyLevel && studyLevel !== "Faculty Member" && (
                <div className="space-y-2">
                  <Label htmlFor="studies" className="text-white">Program *</Label>
                  <Select value={studies} onValueChange={setStudies}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder={`Select your ${studyLevel} program`} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 z-50 max-h-[300px] overflow-y-auto">
                      {getAvailablePrograms().map(program => (
                        <SelectItem key={program} value={program} className="text-white">
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-white">Choose Mascot *</Label>
                <div className="grid grid-cols-4 gap-4">
                  {["/avatar-1.png", "/avatar-2.png", "/avatar-3.png", "/avatar-4.png"].map((mascot, idx) => (
                    <div
                      key={mascot}
                      onClick={() => {
                        setAvatarType("mascot");
                        setSelectedMascot(mascot);
                      }}
                      className={`aspect-square rounded-2xl cursor-pointer overflow-hidden backdrop-blur-xl border-2 transition-all duration-300 ${
                        selectedMascot === mascot
                          ? "bg-cyan-500/30 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                          : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                      }`}
                    >
                      <img 
                        src={mascot} 
                        alt={`Mascot ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleNext}
                  className="rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 text-white hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Bridge Screen */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-center py-8"
            >
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <span className="text-4xl">🤝</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Let's Get to Know You</h3>
                <p className="text-white/70 max-w-md mx-auto">
                  We need to understand your goals and interests to help you find meaningful networking possibilities.
                </p>
              </div>
              <Button 
                onClick={handleNext} 
                className="mt-8 rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 text-white hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* Step 3: AI Chat Interface */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div 
                ref={chatContainerRef}
                className="h-96 overflow-y-auto space-y-4 p-4 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10"
              >
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === "ai"
                          ? "bg-cyan-500/20 text-white border border-cyan-500/30"
                          : "bg-blue-500/20 text-white border border-blue-500/30"
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
                  className="min-h-[60px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit();
                    }
                  }}
                />
                <Button 
                  onClick={handleChatSubmit} 
                  disabled={!currentAnswer.trim()}
                  className="rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 text-white hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300 disabled:opacity-50"
                >
                  Send
                </Button>
              </div>

              {chatAnswers.length >= 3 && (
                <div className="flex justify-center animate-fade-in">
                  <Button 
                    onClick={() => setStep(4)} 
                    size="lg" 
                    className="w-full sm:w-auto rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 text-white hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300"
                  >
                    Continue to Interests
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Interests & Skills */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {chatAnswers.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold mb-1 text-white">AI-Powered Suggestions</h3>
                        <p className="text-sm text-white">Based on your profile answers</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={generateInterestSuggestions}
                        disabled={isGeneratingSuggestions}
                        className="bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 text-white hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300 disabled:opacity-50"
                      >
                        {isGeneratingSuggestions ? "Generating..." : suggestedInterests.length > 0 ? "Regenerate" : "Generate"}
                      </Button>
                    </div>
                    {isGeneratingSuggestions && (
                      <p className="text-sm text-white">Generating personalized interests...</p>
                    )}
                    {suggestedInterests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {suggestedInterests.map(interest => (
                          <Badge
                            key={interest}
                            className={`cursor-pointer backdrop-blur-xl border transition-all duration-300 ${
                              selectedInterests.includes(interest) 
                                ? "bg-cyan-500/30 border-cyan-500/50 text-white hover:bg-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)]" 
                                : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] active:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            }`}
                            onClick={() => toggleInterest(interest)}
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label className="text-slate-400">Search or add custom interest</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search or add custom interest..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-white placeholder:text-slate-400"
                    disabled={isStandardizing}
                  />
                </div>
                {canAddCustom && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <span>Press Enter to add "{searchTerm}"</span>
                    <Button 
                      size="sm" 
                      onClick={handleAddCustomInterest}
                      disabled={isStandardizing}
                      className="rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] active:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-300 disabled:opacity-50"
                    >
                      {isStandardizing ? "Adding..." : "Add"}
                    </Button>
                  </div>
                )}
              </div>

              {selectedInterests.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-white">Your Selected Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map(interest => (
                      <Badge
                        key={interest}
                        className="cursor-pointer bg-cyan-500/30 backdrop-blur-xl border border-cyan-500/50 text-white hover:bg-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-white">Creative & Personal Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredCreative.map(interest => (
                      <Badge
                        key={interest}
                        className={`cursor-pointer backdrop-blur-xl border transition-all duration-300 ${
                          selectedInterests.includes(interest) 
                            ? "bg-cyan-500/30 border-cyan-500/50 text-white hover:bg-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)]" 
                            : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] active:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        }`}
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 text-white">Activity & Lifestyle</h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredLifestyle.map(interest => (
                      <Badge
                        key={interest}
                        className={`cursor-pointer backdrop-blur-xl border transition-all duration-300 ${
                          selectedInterests.includes(interest) 
                            ? "bg-cyan-500/30 border-cyan-500/50 text-white hover:bg-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)]" 
                            : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] active:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        }`}
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button 
                  onClick={handleBack}
                  className="rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleNext}
                  className="rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 text-white hover:bg-cyan-500/30 transition-all duration-300"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Availability Scheduler */}
          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <GoogleCalendarConnect 
                onAvailabilityImported={(imported) => setAvailability(imported)}
              />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or describe your availability
                  </span>
                </div>
              </div>

              <Card className="bg-secondary/5">
                <CardContent className="pt-6 space-y-4">
                  <Label htmlFor="availability-text" className="text-white">
                    Describe your typical availability in your own words
                  </Label>
                  <Textarea
                    id="availability-text"
                    placeholder="E.g., 'Free all next week', 'Available Tuesday and Thursday evenings after 6 PM', 'I am free all the time'"
                    value={availabilityText}
                    onChange={(e) => setAvailabilityText(e.target.value)}
                    className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                    disabled={isParsing}
                  />
                  <Button 
                    onClick={parseAvailability}
                    disabled={isParsing || !availabilityText.trim()}
                    className="w-full rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/40 text-white hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300 disabled:opacity-50"
                  >
                    {isParsing ? "Analyzing..." : "Analyze & Set Availability (AI)"}
                  </Button>
                </CardContent>
              </Card>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or set manually
                  </span>
                </div>
              </div>

              <Button 
                onClick={() => setShowManualCalendar(!showManualCalendar)}
                className="w-full rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] active:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-300"
              >
                {showManualCalendar ? "Hide" : "Show"} Manual Calendar
              </Button>

              {showManualCalendar && (
                <CalendarAvailability 
                  availability={availability}
                  onChange={setAvailability}
                />
              )}

              <div className="flex justify-between gap-2">
                <Button 
                  onClick={handleBack}
                  className="rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={loading}
                  className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:shadow-[0_0_40px_rgba(6,182,212,0.8)] transition-all duration-300 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? "Saving..." : "Finish"}
                </Button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
          </div>
        </div>
      </LiquidCrystalCard>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave the registration form? Aren't you afraid of freezing? ❄️
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleExitConfirm} className="bg-background text-foreground hover:bg-background/90 border border-border">
              Yes, leave
            </AlertDialogAction>
            <AlertDialogCancel className="bg-primary text-primary-foreground hover:bg-primary/90">
              No, stay warm
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default ProfileSetup;

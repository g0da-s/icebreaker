import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Check, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BottomNav } from "@/components/BottomNav";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvailabilityScheduler } from "@/components/AvailabilityScheduler";
import { CalendarAvailability } from "@/components/CalendarAvailability";
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect";
import { AIAvailabilityEditor } from "@/components/AIAvailabilityEditor";
import { DateSpecificAvailability } from "@/components/DateSpecificAvailability";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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

type DayAvailability = {
  active: boolean;
  start: string;
  end: string;
};

type WeekAvailability = {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
};

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [studies, setStudies] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  // Avatar
  const [selectedMascot, setSelectedMascot] = useState<string | null>(null);
  const [avatarType, setAvatarType] = useState<string | null>(null);
  
  // Interests
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Availability
  const [availability, setAvailability] = useState<WeekAvailability>({
    monday: { active: false, start: "09:00", end: "17:00" },
    tuesday: { active: false, start: "09:00", end: "17:00" },
    wednesday: { active: false, start: "09:00", end: "17:00" },
    thursday: { active: false, start: "09:00", end: "17:00" },
    friday: { active: false, start: "09:00", end: "17:00" },
    saturday: { active: false, start: "09:00", end: "17:00" },
    sunday: { active: false, start: "09:00", end: "17:00" },
  });
  const [dateSlots, setDateSlots] = useState<Array<{ date: Date; start: string; end: string }>>([]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch interests
        const { data: interestsData } = await supabase
          .from('user_interests')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // Pre-fill form fields
        if (profileData) {
          const nameParts = profileData.full_name?.split(' ') || [];
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          
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
          
          // Set avatar
          setAvatarType(profileData.avatar_type);
          if (profileData.avatar_type === 'mascot' && profileData.avatar_url) {
            setSelectedMascot(profileData.avatar_url);
          }
          
          // Parse availability
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
        }

        // Pre-fill interests
        if (interestsData) {
          setSelectedInterests(interestsData.tags || []);
          setBio(interestsData.bio || '');
          setLinkedinUrl(interestsData.linkedin_url || '');
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        navigate("/profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate, toast]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
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

  const filteredCreative = CREATIVE_INTERESTS.filter(i =>
    i.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredLifestyle = LIFESTYLE_INTERESTS.filter(i => 
    i.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!firstName || !lastName) {
      toast({
        title: "Name required",
        description: "Please enter your first and last name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Update profile
      const profileUpdate: any = {
        full_name: `${firstName} ${lastName}`,
      };
      
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
      
      // Update avatar if mascot is selected
      if (selectedMascot) {
        profileUpdate.avatar_type = 'mascot';
        profileUpdate.avatar_url = selectedMascot;
      }
      
      const hasActiveAvailability = Object.values(availability).some(day => day.active);
      if (hasActiveAvailability) {
        profileUpdate.availability = availability;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Update interests
      const interestsUpdate: any = {};
      if (selectedInterests.length > 0) interestsUpdate.tags = selectedInterests;
      if (bio) interestsUpdate.bio = bio;
      if (linkedinUrl) interestsUpdate.linkedin_url = linkedinUrl;

      if (Object.keys(interestsUpdate).length > 0) {
        const { data: existingInterests } = await supabase
          .from('user_interests')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (existingInterests) {
          const { error: updateError } = await supabase
            .from('user_interests')
            .update(interestsUpdate)
            .eq('user_id', session.user.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('user_interests')
            .insert({
              user_id: session.user.id,
              ...interestsUpdate,
            });
          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Profile Updated",
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
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account has been deleted.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container max-w-screen-sm mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading profile...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-24">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Profile</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </div>
              {/* Avatar Preview */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/20 flex items-center justify-center bg-muted">
                {selectedMascot ? (
                  <img 
                    src={selectedMascot} 
                    alt="Selected avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {firstName ? firstName.charAt(0) : '?'}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
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
                <Label htmlFor="studyLevel">Study Level</Label>
                <Select value={studyLevel} onValueChange={(value) => {
                  setStudyLevel(value);
                  setStudies("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your study level" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {STUDY_LEVELS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {studyLevel && studyLevel !== "Faculty Member" && (
                <div className="space-y-2">
                  <Label htmlFor="studies">Program</Label>
                  <Select value={studies} onValueChange={setStudies}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select your ${studyLevel} program`} />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50 max-h-[300px] overflow-y-auto">
                      {getAvailablePrograms().map(program => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            {/* Avatar Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose your Avatar</h3>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((num) => {
                  const avatarPath = `/avatar-${num}.png`;
                  const isSelected = selectedMascot === avatarPath;
                  
                  return (
                    <div
                      key={num}
                      onClick={() => setSelectedMascot(avatarPath)}
                      className={cn(
                        "relative aspect-square rounded-full overflow-hidden cursor-pointer transition-all duration-200",
                        "border-4 hover:scale-105",
                        isSelected 
                          ? "border-primary shadow-lg shadow-primary/50" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img 
                        src={avatarPath} 
                        alt={`Avatar ${num}`}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                Select one of the avatars to represent you on the platform
              </p>
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Interests & Skills</h3>
              
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
                  <h4 className="text-sm font-semibold mb-3">Creative & Personal Interests</h4>
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
                  <h4 className="text-sm font-semibold mb-3">Activity & Lifestyle</h4>
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
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Availability</h3>
              
              <AIAvailabilityEditor 
                onAvailabilityUpdated={(updated) => setAvailability(updated)}
                onDateSlotsUpdated={(slots) => setDateSlots([...dateSlots, ...slots])}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or use other methods
                  </span>
                </div>
              </div>

              <GoogleCalendarConnect 
                onAvailabilityImported={(imported) => setAvailability(imported)}
              />

              <CalendarAvailability 
                availability={availability}
                onChange={setAvailability}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Specific dates
                  </span>
                </div>
              </div>

              <DateSpecificAvailability 
                dateSlots={dateSlots}
                onChange={setDateSlots}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/profile")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-destructive/20">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Irreversible actions that affect your account
                  </p>
                </div>
                
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteAccount();
                        }}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? "Deleting..." : "Yes, Delete Account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default EditProfile;

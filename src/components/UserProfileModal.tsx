import { Dialog, DialogPortal, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { formatDisplayName } from "@/lib/utils";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    full_name: string;
    studies?: string;
    role?: string;
    avatar_url?: string | null;
    avatar_type?: string | null;
    tags: string[];
    bio?: string | null;
  };
  onScheduleMeeting?: () => void;
}

const CREATIVE_INTERESTS = [
  "Photography", "Music", "Art", "Design", "Writing", "Dance", "Theater", "Cooking", "Crafts", "Fashion"
];

const LIFESTYLE_INTERESTS = [
  "Sports", "Fitness", "Travel", "Gaming", "Reading", "Hiking", "Yoga", "Running", "Cycling", "Swimming"
];

export const UserProfileModal = ({ 
  open, 
  onOpenChange, 
  user,
  onScheduleMeeting 
}: UserProfileModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-md bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]">
          <LiquidCrystalCard className="w-full animate-scale-in">
            <DialogClose className="absolute right-4 top-4 z-50 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-4 w-4 text-white hover:text-destructive transition-colors" />
              <span className="sr-only">Close</span>
            </DialogClose>
            <div className="space-y-6 p-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center pt-4">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage 
                    src={user.avatar_url || undefined} 
                    alt={user.full_name} 
                  />
                  <AvatarFallback className="text-2xl">
                    {user.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {formatDisplayName(user.full_name)}
                </h2>
                <p className="text-slate-300 mb-2">
                  {user.studies?.includes(' - ') 
                    ? user.studies.split(' - ')[1]
                    : user.studies
                  }
                </p>
                {user.studies?.includes(' - ') && (
                  <p className="text-sm text-slate-300 mb-2">
                    {user.studies.split(' - ')[0]}
                  </p>
                )}
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">{user.role}</Badge>
              </div>

              {/* Bio */}
              {user.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Bio
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Interests */}
              {user.tags.filter(tag => CREATIVE_INTERESTS.includes(tag)).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.tags
                      .filter(tag => CREATIVE_INTERESTS.includes(tag))
                      .map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-white/5 text-slate-300 border-white/20">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {user.tags.filter(tag => LIFESTYLE_INTERESTS.includes(tag)).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.tags
                      .filter(tag => LIFESTYLE_INTERESTS.includes(tag))
                      .map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-white/5 text-slate-300 border-white/20">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {onScheduleMeeting && (
                <Button 
                  size="lg" 
                  className="w-full h-12"
                  onClick={onScheduleMeeting}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule a Meeting
                </Button>
              )}
            </div>
          </LiquidCrystalCard>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
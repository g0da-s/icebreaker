import { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { formatDisplayName } from "@/lib/utils";
import { LiquidCrystalCard } from "@/components/landing/LiquidCrystalCard";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

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
          <VisuallyHidden.Root>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              View user profile information
            </DialogDescription>
          </VisuallyHidden.Root>
          <LiquidCrystalCard className="w-full animate-scale-in">
            <DialogClose className="absolute right-4 top-4 z-50 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-4 w-4 text-white hover:text-destructive transition-colors" />
              <span className="sr-only">Close</span>
            </DialogClose>
            <div className="space-y-6 p-6">
              {/* Centered Avatar Section */}
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4 border-4 border-white/20 shadow-xl">
                  <AvatarImage 
                    src={user.avatar_url || undefined} 
                    alt={user.full_name} 
                  />
                  <AvatarFallback className="text-2xl">
                    {user.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                {/* Name */}
                <h2 className="text-2xl font-bold text-white mb-2">
                  {formatDisplayName(user.full_name)}
                </h2>
                
                {/* Role Badge under name */}
                {user.role && (
                  <Badge className="mb-4 bg-cyan-500/20 text-white border-cyan-500/40 px-4 py-1">
                    {user.role}
                  </Badge>
                )}
              </div>

              {/* Interests & Skills Section */}
              {user.tags && user.tags.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/80">
                    Interests & Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        className="bg-white/10 text-white border-white/20 hover:bg-white/15 transition-colors"
                      >
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
                  className="w-full h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/20"
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
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { formatDisplayName } from "@/lib/utils";

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
      <DialogContent className="max-w-md [&>button]:hover:text-destructive [&>button]:transition-colors">
        <div className="space-y-6 pt-4">
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
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {formatDisplayName(user.full_name)}
            </h2>
            <p className="text-muted-foreground mb-2">
              {user.studies?.includes(' - ') 
                ? user.studies.split(' - ')[1]
                : user.studies
              }
            </p>
            {user.studies?.includes(' - ') && (
              <p className="text-sm text-muted-foreground mb-2">
                {user.studies.split(' - ')[0]}
              </p>
            )}
            <Badge variant="secondary">{user.role}</Badge>
          </div>

          {/* Bio */}
          {user.bio && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Bio
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {user.bio}
              </p>
            </div>
          )}

          {/* Interests */}
          {user.tags.filter(tag => CREATIVE_INTERESTS.includes(tag)).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.tags
                  .filter(tag => CREATIVE_INTERESTS.includes(tag))
                  .map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {user.tags.filter(tag => LIFESTYLE_INTERESTS.includes(tag)).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.tags
                  .filter(tag => LIFESTYLE_INTERESTS.includes(tag))
                  .map((tag, index) => (
                    <Badge key={index} variant="outline">
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
      </DialogContent>
    </Dialog>
  );
};
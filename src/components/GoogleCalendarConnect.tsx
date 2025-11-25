import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Link2, Unlink } from "lucide-react";

interface GoogleCalendarConnectProps {
  onAvailabilityImported?: (availability: any) => void;
}

export const GoogleCalendarConnect = ({ onAvailabilityImported }: GoogleCalendarConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setLoading(true);
    
    // Simulated Google Calendar OAuth flow
    // In production, this would redirect to Google OAuth
    setTimeout(() => {
      setIsConnected(true);
      setLoading(false);
      
      toast({
        title: "Google Calendar Connected",
        description: "Your availability has been synced",
      });

      // Simulate imported availability
      const mockAvailability = {
        monday: { active: true, start: "09:00", end: "17:00" },
        tuesday: { active: true, start: "09:00", end: "17:00" },
        wednesday: { active: true, start: "09:00", end: "17:00" },
        thursday: { active: true, start: "09:00", end: "17:00" },
        friday: { active: true, start: "09:00", end: "17:00" },
        saturday: { active: false, start: "09:00", end: "17:00" },
        sunday: { active: false, start: "09:00", end: "17:00" },
      };
      
      if (onAvailabilityImported) {
        onAvailabilityImported(mockAvailability);
      }
    }, 1500);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "Calendar Disconnected",
      description: "Google Calendar has been unlinked",
    });
  };

  return (
    <Card className="p-4 border-dashed">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Google Calendar</h4>
            <p className="text-xs text-muted-foreground">
              {isConnected ? "Connected and synced" : "Sync your availability automatically"}
            </p>
          </div>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1">
              <Link2 className="w-3 h-3" />
              Connected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              <Unlink className="w-4 h-4 mr-1" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={loading}
            size="sm"
          >
            {loading ? "Connecting..." : "Connect"}
          </Button>
        )}
      </div>
    </Card>
  );
};

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Link2, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleCalendarConnectProps {
  onAvailabilityImported?: (availability: any) => void;
}

export const GoogleCalendarConnect = ({ onAvailabilityImported }: GoogleCalendarConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_connected')
        .eq('id', user.id)
        .single();

      setIsConnected(profile?.google_calendar_connected || false);
    } catch (error) {
      console.error('Error checking calendar connection:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const clientId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const redirectUri = `${window.location.origin}/auth/callback/google`;
      
      // Construct Google OAuth URL
      const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      oauthUrl.searchParams.append('client_id', import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || clientId);
      oauthUrl.searchParams.append('redirect_uri', redirectUri);
      oauthUrl.searchParams.append('response_type', 'code');
      oauthUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events');
      oauthUrl.searchParams.append('access_type', 'offline');
      oauthUrl.searchParams.append('prompt', 'consent');
      oauthUrl.searchParams.append('state', user.id);

      // Redirect to Google OAuth
      window.location.href = oauthUrl.toString();
    } catch (error) {
      console.error('OAuth error:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Google Calendar",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          google_access_token: null,
          google_refresh_token: null,
          google_token_expires_at: null,
          google_calendar_connected: false,
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsConnected(false);
      toast({
        title: "Calendar Disconnected",
        description: "Google Calendar has been unlinked",
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Disconnection Failed",
        description: "Could not disconnect Google Calendar",
        variant: "destructive",
      });
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-fetch');
      
      if (error) throw error;
      
      if (data?.availability && onAvailabilityImported) {
        onAvailabilityImported(data.availability);
        toast({
          title: "Availability Synced",
          description: "Your calendar has been synced successfully",
        });
      }
    } catch (error) {
      console.error('Fetch availability error:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync calendar availability",
        variant: "destructive",
      });
    }
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

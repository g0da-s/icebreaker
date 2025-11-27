import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Link2, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_CALENDAR_SCOPES } from "@/config/google-oauth";

interface GoogleCalendarConnectProps {
  onAvailabilityImported?: (availability: any) => void;
}

export const GoogleCalendarConnect = ({ onAvailabilityImported }: GoogleCalendarConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if user already has Google Calendar connected
  useEffect(() => {
    const checkConnection = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_connected')
        .eq('id', user.id)
        .single();

      if (profile?.google_calendar_connected) {
        setIsConnected(true);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to connect Google Calendar",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Construct OAuth URL
      const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth`;
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_OAUTH_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', GOOGLE_CALENDAR_SCOPES);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', user.id); // Pass user ID as state

      // Redirect to Google OAuth
      window.location.href = authUrl.toString();
      
    } catch (error) {
      console.error('OAuth initiation error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Google Calendar connection",
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
        title: "Error",
        description: "Failed to disconnect Google Calendar",
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

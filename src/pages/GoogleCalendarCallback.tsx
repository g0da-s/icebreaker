import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const GoogleCalendarCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast({
          title: "Connection Failed",
          description: "Google Calendar connection was cancelled",
          variant: "destructive",
        });
        navigate('/profile-setup');
        return;
      }

      if (code) {
        // The OAuth callback edge function will handle the token exchange
        // and update the user profile. We just need to redirect back.
        toast({
          title: "Google Calendar Connected",
          description: "Your calendar has been synced successfully",
        });
        navigate('/profile-setup');
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Connecting to Google Calendar...</p>
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;

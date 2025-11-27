import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarEventRequest {
  meetingId: string;
  attendeeEmail: string;
  scheduledAt: string;
  location?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { meetingId, attendeeEmail, scheduledAt, location } = await req.json() as CalendarEventRequest;

    // Get user's Google tokens
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_token_expires_at, full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    if (!profile.google_access_token) {
      throw new Error('Google Calendar not connected');
    }

    // Check if token needs refresh
    let accessToken = profile.google_access_token;
    const expiresAt = new Date(profile.google_token_expires_at);
    const now = new Date();

    if (now >= expiresAt) {
      // Token expired, refresh it
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') ?? '',
          refresh_token: profile.google_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update token in database
      await supabaseClient
        .from('profiles')
        .update({
          google_access_token: accessToken,
          google_token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('id', user.id);
    }

    // Create calendar event
    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour meeting

    const calendarEvent = {
      summary: `Meeting with ${attendeeEmail}`,
      description: `Icebreaker meeting scheduled via Icebreaker-AI`,
      location: location || 'Online',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: attendeeEmail },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Calendar API error:', errorText);
      throw new Error('Failed to create calendar event');
    }

    const eventData = await calendarResponse.json();

    // Update meeting with calendar event ID
    await supabaseClient
      .from('meetings')
      .update({
        calendar_event_id: eventData.id,
        location: location,
      })
      .eq('id', meetingId);

    return new Response(
      JSON.stringify({ success: true, eventId: eventData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating calendar event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

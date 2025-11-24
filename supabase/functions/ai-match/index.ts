import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user's interests
    const { data: currentUser } = await supabase
      .from('user_interests')
      .select('tags')
      .eq('user_id', userId)
      .single();

    // Get all other users with their interests
    const { data: allUsers } = await supabase
      .from('user_interests')
      .select(`
        user_id,
        tags,
        bio
      `)
      .neq('user_id', userId);

    if (!allUsers || allUsers.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profiles for all users
    const userIds = allUsers.map((u: any) => u.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    // Get availability for all users
    const { data: availabilities } = await supabase
      .from('user_availability')
      .select('user_id, day_of_week, start_time, end_time')
      .in('user_id', userIds)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    const profilesMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
    
    // Group availabilities by user
    const availabilityMap = new Map();
    availabilities?.forEach((avail: any) => {
      if (!availabilityMap.has(avail.user_id)) {
        availabilityMap.set(avail.user_id, []);
      }
      availabilityMap.get(avail.user_id).push(avail);
    });

    // Helper to format earliest availability
    const getEarliestAvailability = (userId: string) => {
      const userAvail = availabilityMap.get(userId);
      if (!userAvail || userAvail.length === 0) return null;
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const earliest = userAvail[0];
      return `${days[earliest.day_of_week]} at ${earliest.start_time}`;
    };

    // Use AI to find the best matches
    const prompt = `Based on this search: "${searchQuery}"
    
Current user interests: ${currentUser?.tags?.join(', ') || 'none'}

Available users and their interests:
${allUsers.map((u: any, i: number) => {
  const profile = profilesMap.get(u.user_id);
  return `${i + 1}. ${profile?.full_name || 'User'} - Interests: ${u.tags?.join(', ') || 'none'} - Bio: ${u.bio || 'none'}`;
}).join('\n')}

Please analyze and return the top 3-5 best matches as a JSON array. Each match should include:
- user_id (from the list above)
- match_score (0-100)
- reason (why they match - keep it brief, 1-2 sentences)

Return ONLY valid JSON array, no markdown or explanation.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that matches people based on interests and goals. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    let matches = [];

    try {
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      matches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      matches = [];
    }

    // Enrich matches with user details and availability
    const enrichedMatches = matches.map((match: any) => {
      const user = allUsers.find((u: any) => u.user_id === match.user_id);
      const profile = profilesMap.get(match.user_id);
      const earliestAvailable = getEarliestAvailability(match.user_id);
      
      return {
        ...match,
        full_name: profile?.full_name || 'Unknown',
        email: profile?.email || '',
        tags: user?.tags || [],
        earliest_available: earliestAvailable,
      };
    });

    return new Response(JSON.stringify({ matches: enrichedMatches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-match function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
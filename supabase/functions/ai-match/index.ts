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

    // Get profiles for all users (including ai_summary and onboarding_answers)
    const userIds = allUsers.map((u: any) => u.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, avatar_type, ai_summary, onboarding_answers')
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

Available users and their information:
${allUsers.map((u: any, i: number) => {
  const profile = profilesMap.get(u.user_id);
  const aiSummary = profile?.ai_summary || '';
  const onboardingData = profile?.onboarding_answers || {};
  const onboardingText = Object.values(onboardingData).filter(Boolean).join('. ');
  
  return `User Index ${i}: ${profile?.full_name || 'User'} (ID: ${u.user_id})
- Interests: ${u.tags?.join(', ') || 'none'}
- Bio: ${u.bio || 'none'}
- AI Story: ${aiSummary}
- Background: ${onboardingText}`;
}).join('\n\n')}

Please analyze and return the top 3-5 best matches as a JSON array. Each match MUST include:
- user_index (the index number from the list above, as a number)
- match_score (0-100, as a number)
- reason (why they match - keep it brief, 1-2 sentences)

CRITICAL INSTRUCTIONS:
- Use the exact user_index number (0, 1, 2, etc.) from the list above
- In the reason text, ALWAYS refer to the matched person as "This user" instead of using their actual name
- Never include the person's name in the reason description
- Consider ALL provided information: interests, bio, AI story, and background

Return ONLY valid JSON array, no markdown or explanation. Example format:
[{"user_index": 0, "match_score": 95, "reason": "This user's interest in startups directly aligns with the goal of finding a co-founder."}]`;

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
      const userIndex = typeof match.user_index === 'number' ? match.user_index : parseInt(match.user_index);
      
      if (userIndex < 0 || userIndex >= allUsers.length) {
        console.error(`Invalid user_index: ${userIndex}`);
        return null;
      }
      
      const user = allUsers[userIndex];
      const profile = profilesMap.get(user.user_id);
      const earliestAvailable = getEarliestAvailability(user.user_id);
      
      // Sanitize reason to replace any names with "This user"
      let sanitizedReason = match.reason || '';
      if (profile?.full_name) {
        const nameParts = profile.full_name.split(' ');
        nameParts.forEach((part: string) => {
          if (part.length > 2) {
            const regex = new RegExp(part, 'gi');
            sanitizedReason = sanitizedReason.replace(regex, 'This user');
          }
        });
      }
      
      return {
        user_id: user.user_id,
        match_score: match.match_score,
        reason: sanitizedReason,
        full_name: profile?.full_name || 'Unknown',
        email: profile?.email || '',
        studies: profile?.studies || null,
        role: profile?.role || null,
        avatar_url: profile?.avatar_url || null,
        avatar_type: profile?.avatar_type || null,
        tags: user?.tags || [],
        bio: user?.bio || null,
        earliest_available: earliestAvailable,
      };
    }).filter(Boolean);

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
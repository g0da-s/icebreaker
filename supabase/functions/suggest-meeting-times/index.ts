import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requesterAvailability, recipientAvailability, preferredDays, preferredTimes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const systemPrompt = `You are a smart meeting scheduler. Analyze two users' weekly availability and suggest the best meeting times.

CRITICAL: Only suggest times that are in the future. Current date is ${today} and current time is ${currentTime}.

Consider:
- Overlapping time slots
- Only suggest times after the current date and time
- Preferred days (weekdays are usually better than weekends)
- Time of day (mid-morning and early afternoon are often ideal)
- Meeting length (assume 1-hour meetings)
- Provide at least 5-8 diverse options across different days

Return suggestions in this exact format:
{
  "suggestions": [
    {
      "day": "monday",
      "date": "2025-11-24",
      "startTime": "10:00",
      "endTime": "11:00",
      "reason": "Mid-morning slot, both users available, good focus time"
    }
  ]
}`;

    const userPrompt = `Requester availability: ${JSON.stringify(requesterAvailability)}
Recipient availability: ${JSON.stringify(recipientAvailability)}
${preferredDays ? `Preferred days: ${preferredDays}` : ''}
${preferredTimes ? `Preferred times: ${preferredTimes}` : ''}

Suggest 5-8 optimal meeting times for this week and next week.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_meeting_times",
              description: "Return 5-8 optimal meeting time suggestions based on mutual availability",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { 
                          type: "string",
                          enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                        },
                        date: { type: "string", description: "ISO date format YYYY-MM-DD" },
                        startTime: { type: "string", description: "HH:mm format" },
                        endTime: { type: "string", description: "HH:mm format" },
                        reason: { type: "string", description: "Brief reason why this time is good" }
                      },
                      required: ["day", "date", "startTime", "endTime", "reason"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_meeting_times" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const suggestions = JSON.parse(toolCall.function.arguments);
    
    // Filter out any past time slots as a safety measure
    const filterDate = new Date();
    const filteredSuggestions = {
      suggestions: suggestions.suggestions.filter((slot: any) => {
        const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
        return slotDateTime > filterDate;
      })
    };
    
    return new Response(JSON.stringify(filteredSuggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in suggest-meeting-times:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

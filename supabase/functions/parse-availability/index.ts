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
    const { text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const currentDate = new Date().toISOString();

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `You are a calendar parsing assistant. Convert natural language availability into a weekly schedule format. Current date/time: ${currentDate}. Return a weekly schedule where each day (monday-sunday) has: active (boolean), start (HH:mm format), end (HH:mm format). If user says "free all the time" or "available always", set all days active from 09:00 to 17:00. If specific days/times mentioned, parse accordingly.`
          },
          { 
            role: 'user', 
            content: `Parse this availability: "${text}"`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_availability",
              description: "Set weekly availability schedule",
              parameters: {
                type: "object",
                properties: {
                  monday: { 
                    type: "object",
                    properties: {
                      active: { type: "boolean" },
                      start: { type: "string", pattern: "^([0-1][0-9]|2[0-3]):[0-5][0-9]$" },
                      end: { type: "string", pattern: "^([0-1][0-9]|2[0-3]):[0-5][0-9]$" }
                    },
                    required: ["active", "start", "end"]
                  },
                  tuesday: { 
                    type: "object",
                    properties: {
                      active: { type: "boolean" },
                      start: { type: "string" },
                      end: { type: "string" }
                    },
                    required: ["active", "start", "end"]
                  },
                  wednesday: { 
                    type: "object",
                    properties: {
                      active: { type: "boolean" },
                      start: { type: "string" },
                      end: { type: "string" }
                    },
                    required: ["active", "start", "end"]
                  },
                  thursday: { 
                    type: "object",
                    properties: {
                      active: { type: "boolean" },
                      start: { type: "string" },
                      end: { type: "string" }
                    },
                    required: ["active", "start", "end"]
                  },
                  friday: { 
                    type: "object",
                    properties: {
                      active: { type: "boolean" },
                      start: { type: "string" },
                      end: { type: "string" }
                    },
                    required: ["active", "start", "end"]
                  },
                  saturday: { 
                    type: "object",
                    properties: {
                      active: { type: "boolean" },
                      start: { type: "string" },
                      end: { type: "string" }
                    },
                    required: ["active", "start", "end"]
                  },
                  sunday: { 
                    type: "object",
                    properties: {
                      active: { type: "boolean" },
                      start: { type: "string" },
                      end: { type: "string" }
                    },
                    required: ["active", "start", "end"]
                  }
                },
                required: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "set_availability" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('Failed to parse availability');
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const availabilitySchedule = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ availability: availabilitySchedule }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing availability:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

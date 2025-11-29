import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required');
    }

    console.log(`Fetching users created between ${startDate} and ${endDate}`);

    // Get all user IDs from profiles table for the specified date range
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at')
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users found in the specified date range', deletedCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${profiles.length} users to delete`);

    // Delete each user using admin API
    const deleteResults = [];
    for (const profile of profiles) {
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);
        if (deleteError) {
          console.error(`Error deleting user ${profile.email}:`, deleteError);
          deleteResults.push({ id: profile.id, email: profile.email, success: false, error: deleteError.message });
        } else {
          console.log(`Successfully deleted user: ${profile.email}`);
          deleteResults.push({ id: profile.id, email: profile.email, success: true });
        }
      } catch (error) {
        console.error(`Exception deleting user ${profile.email}:`, error);
        deleteResults.push({ 
          id: profile.id, 
          email: profile.email, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = deleteResults.filter(r => r.success).length;
    const failureCount = deleteResults.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${successCount} users, ${failureCount} failures`,
        deletedCount: successCount,
        failedCount: failureCount,
        results: deleteResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in batch-delete-users function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

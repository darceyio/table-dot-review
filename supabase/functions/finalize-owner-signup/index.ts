import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinalizeOwnerPayload {
  firstName?: string;
  lastName?: string;
  businessName: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  businessLogoUrl?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payload from request
    const payload: FinalizeOwnerPayload = await req.json();
    console.log('Finalizing owner signup for user:', user.id);

    // Use service role client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Upsert app_user
    if (payload.firstName || payload.lastName) {
      const { error: appUserError } = await supabaseAdmin
        .from('app_user')
        .upsert({
          id: user.id,
          first_name: payload.firstName || null,
          last_name: payload.lastName || null,
          display_name: payload.firstName && payload.lastName 
            ? `${payload.firstName} ${payload.lastName}`
            : payload.firstName || payload.lastName || user.email || 'Owner',
        }, { onConflict: 'id' });

      if (appUserError) {
        console.error('Error upserting app_user:', appUserError);
      }
    }

    // 2. Ensure user_roles has owner role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'owner',
      }, { onConflict: 'user_id,role', ignoreDuplicates: true });

    if (roleError) {
      console.error('Error upserting user_role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Upsert owner_profile
    const { error: profileError } = await supabaseAdmin
      .from('owner_profile')
      .upsert({
        user_id: user.id,
        business_name: payload.businessName,
        contact_email: payload.contactEmail || null,
        contact_phone: payload.contactPhone || null,
        address: payload.address || null,
        latitude: payload.latitude || null,
        longitude: payload.longitude || null,
        business_logo_url: payload.businessLogoUrl || null,
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('Error upserting owner_profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Owner signup finalized successfully for:', user.id);

    return new Response(
      JSON.stringify({ role: 'owner', success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

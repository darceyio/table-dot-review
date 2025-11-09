import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinalizeServerPayload {
  firstName?: string;
  lastName?: string;
  walletAddresses?: Array<{ address: string; network: string; label?: string }>;
  bio?: string;
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
    const payload: FinalizeServerPayload = await req.json();
    console.log('Finalizing server signup for user:', user.id);

    // Use service role client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Upsert app_user (if trigger didn't run or data missing)
    if (payload.firstName || payload.lastName) {
      const { error: appUserError } = await supabaseAdmin
        .from('app_user')
        .upsert({
          id: user.id,
          first_name: payload.firstName || null,
          last_name: payload.lastName || null,
          display_name: payload.firstName && payload.lastName 
            ? `${payload.firstName} ${payload.lastName}`
            : payload.firstName || payload.lastName || user.email || 'Server',
        }, { onConflict: 'id' });

      if (appUserError) {
        console.error('Error upserting app_user:', appUserError);
      }
    }

    // 2. Ensure user_roles has server role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'server',
      }, { onConflict: 'user_id,role', ignoreDuplicates: true });

    if (roleError) {
      console.error('Error upserting user_role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Prepare wallet addresses as string[]
    const walletValues = Array.isArray(payload.walletAddresses)
      ? payload.walletAddresses.map((w: any) => typeof w === 'string' ? w : w?.address).filter((x: any) => !!x)
      : [];

    // 4. Upsert server_profile
    const { error: profileError } = await supabaseAdmin
      .from('server_profile')
      .upsert({
        server_id: user.id,
        first_name: payload.firstName || null,
        last_name: payload.lastName || null,
        wallet_addresses: walletValues,
        global_wallet_address: walletValues[0] || null,
        bio: payload.bio || null,
      }, { onConflict: 'server_id' });

    if (profileError) {
      console.error('Error upserting server_profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Server signup finalized successfully for:', user.id);

    return new Response(
      JSON.stringify({ role: 'server', success: true }),
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

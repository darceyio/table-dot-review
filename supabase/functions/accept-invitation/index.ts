import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  invitationId?: string;
  token?: string;
}

serve(async (req: Request) => {
  console.log('[accept-invitation] Request received:', req.method, req.url);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token') || undefined;
    
    let requestBody: AcceptInvitationRequest = {};
    try {
      requestBody = await req.json();
      console.log('[accept-invitation] Request body:', requestBody);
    } catch (e) {
      console.log('[accept-invitation] No JSON body, using query params');
    }
    
    const { invitationId, token: bodyToken } = requestBody;
    const token = bodyToken || queryToken;
    
    console.log('[accept-invitation] Params:', { invitationId, hasToken: !!token });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.error('[accept-invitation] Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Client bound to the caller (to read auth user)
    const authHeader = req.headers.get('Authorization');
    console.log('[accept-invitation] Auth header present:', !!authHeader);
    const jwt = (authHeader || '').startsWith('Bearer ') ? (authHeader || '').slice(7) : '';
    
    const userClient = createClient(supabaseUrl, anonKey);

    // Service role client (to bypass RLS for controlled writes)
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
    console.log('[accept-invitation] User auth result:', { 
      hasUser: !!userData?.user, 
      error: userError?.message 
    });
    
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }), 
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = userData.user;
    const userEmail = (user.email || '').toLowerCase();
    console.log('[accept-invitation] User identified:', { userId: user.id, email: userEmail });

    // Lookup invitation by id or token
    let invitationRow: any = null;
    if (invitationId) {
      console.log('[accept-invitation] Looking up invitation by ID:', invitationId);
      const { data, error } = await admin
        .from('invitations')
        .select('id, org_id, email, status, expires_at')
        .eq('id', invitationId)
        .single();
      
      if (error) {
        console.error('[accept-invitation] Invitation lookup error:', error);
        return new Response(
          JSON.stringify({ error: 'Invitation not found', details: error.message }), 
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      invitationRow = data;
    } else if (token) {
      console.log('[accept-invitation] Looking up invitation by token');
      const { data, error } = await admin
        .from('invitations')
        .select('id, org_id, email, status, expires_at')
        .eq('token', token)
        .single();
      
      if (error) {
        console.error('[accept-invitation] Invitation lookup error:', error);
        return new Response(
          JSON.stringify({ error: 'Invitation not found', details: error.message }), 
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      invitationRow = data;
    } else {
      console.error('[accept-invitation] Missing invitation identifier');
      return new Response(
        JSON.stringify({ error: 'Missing invitation identifier' }), 
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[accept-invitation] Invitation found:', { 
      id: invitationRow.id, 
      status: invitationRow.status, 
      email: invitationRow.email,
      expires_at: invitationRow.expires_at 
    });

    const isValid = invitationRow && invitationRow.status === 'pending' && new Date(invitationRow.expires_at) > new Date();
    if (!isValid) {
      const reason = !invitationRow ? 'not found' : 
                     invitationRow.status !== 'pending' ? `status is ${invitationRow.status}` :
                     'expired';
      console.error('[accept-invitation] Invitation invalid:', reason);
      return new Response(
        JSON.stringify({ error: 'Invitation invalid or expired', details: reason }), 
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const invitedEmail = (invitationRow.email || '').toLowerCase();
    if (invitedEmail !== userEmail) {
      console.error('[accept-invitation] Email mismatch:', { invited: invitedEmail, user: userEmail });
      return new Response(
        JSON.stringify({ error: 'Invitation email does not match authenticated user' }), 
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Mark accepted
    console.log('[accept-invitation] Marking invitation as accepted');
    const { error: updError } = await admin
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitationRow.id);
    
    if (updError) {
      console.error('[accept-invitation] Failed to update invitation:', updError);
      return new Response(
        JSON.stringify({ error: 'Failed to update invitation', details: updError.message }), 
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Ensure the user has the 'server' role (idempotent)
    console.log('[accept-invitation] Ensuring server role for user:', user.id);
    const { error: roleError } = await admin
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'server' }, { onConflict: 'user_id,role', ignoreDuplicates: true });
    
    if (roleError) {
      console.error('[accept-invitation] Role upsert error:', roleError);
      throw new Error(`Failed to assign server role: ${roleError.message}`);
    }

    // Check if server_profile exists, if not create it
    console.log('[accept-invitation] Checking server_profile for user:', user.id);
    const { data: existingProfile, error: profileCheckError } = await admin
      .from('server_profile')
      .select('server_id')
      .eq('server_id', user.id)
      .maybeSingle();

    if (profileCheckError) {
      console.error('[accept-invitation] Profile check error:', profileCheckError);
      throw new Error(`Failed to check server profile: ${profileCheckError.message}`);
    }

    if (!existingProfile) {
      console.log('[accept-invitation] Creating server_profile for user:', user.id);
      const { error: profileError } = await admin
        .from('server_profile')
        .insert({ server_id: user.id });
      
      if (profileError) {
        console.error('[accept-invitation] Profile creation error:', profileError);
        throw new Error(`Failed to create server profile: ${profileError.message}`);
      }
    }

    // Check if assignment already exists
    console.log('[accept-invitation] Checking existing assignment:', { org_id: invitationRow.org_id, server_id: user.id });
    const { data: existingAssignment } = await admin
      .from('server_assignment')
      .select('id, is_active')
      .eq('org_id', invitationRow.org_id)
      .eq('server_id', user.id)
      .maybeSingle();

    if (existingAssignment) {
      console.log('[accept-invitation] Assignment already exists:', existingAssignment);
      // If inactive, reactivate it
      if (!existingAssignment.is_active) {
        const { error: updateError } = await admin
          .from('server_assignment')
          .update({ is_active: true, started_at: new Date().toISOString(), ended_at: null })
          .eq('id', existingAssignment.id);
        
        if (updateError) {
          console.error('[accept-invitation] Assignment reactivation error:', updateError);
          throw new Error(`Failed to reactivate assignment: ${updateError.message}`);
        }
        console.log('[accept-invitation] Assignment reactivated');
      } else {
        console.log('[accept-invitation] Assignment already active');
      }
    } else {
      // Create new active server assignment
      console.log('[accept-invitation] Creating new server assignment');
      const { error: assignError } = await admin
        .from('server_assignment')
        .insert({ org_id: invitationRow.org_id, server_id: user.id, is_active: true });
      
      if (assignError) {
        console.error('[accept-invitation] Assignment creation error:', assignError);
        throw new Error(`Failed to create server assignment: ${assignError.message}`);
      }
      console.log('[accept-invitation] Assignment created successfully');
    }

    console.log('[accept-invitation] Success! Invitation accepted and assignment created');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('[accept-invitation] Unexpected error:', {
      message: e?.message,
      stack: e?.stack,
      name: e?.name
    });
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: e?.message ?? 'Unknown error',
      type: e?.name ?? 'Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

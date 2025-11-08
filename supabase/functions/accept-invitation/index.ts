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
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token') || undefined;
    const { invitationId, token: bodyToken }: AcceptInvitationRequest = await req.json().catch(() => ({}));
    const token = bodyToken || queryToken;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Client bound to the caller (to read auth user)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    // Service role client (to bypass RLS for controlled writes)
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const user = userData.user;
    const userEmail = (user.email || '').toLowerCase();

    // Lookup invitation by id or token
    let invitationRow: any = null;
    if (invitationId) {
      const { data, error } = await admin
        .from('invitations')
        .select('id, org_id, email, status, expires_at')
        .eq('id', invitationId)
        .single();
      if (error) throw error;
      invitationRow = data;
    } else if (token) {
      const { data, error } = await admin
        .from('invitations')
        .select('id, org_id, email, status, expires_at')
        .eq('token', token)
        .single();
      if (error) throw error;
      invitationRow = data;
    } else {
      return new Response(JSON.stringify({ error: 'Missing invitation identifier' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const isValid = invitationRow && invitationRow.status === 'pending' && new Date(invitationRow.expires_at) > new Date();
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invitation invalid or expired' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if ((invitationRow.email || '').toLowerCase() !== userEmail) {
      return new Response(JSON.stringify({ error: 'Invitation email does not match authenticated user' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Mark accepted
    const { error: updError } = await admin
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitationRow.id);
    if (updError) throw updError;

    // Ensure the user has the 'server' role (idempotent)
    await admin
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'server' }, { onConflict: 'user_id,role', ignoreDuplicates: true });

    // Create active server assignment
    const { error: assignError } = await admin
      .from('server_assignment')
      .insert({ org_id: invitationRow.org_id, server_id: user.id, is_active: true });
    if (assignError) throw assignError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('accept-invitation error', e);
    return new Response(JSON.stringify({ error: e?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

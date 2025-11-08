import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResolveInvitationRequest {
  token?: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Accept token from query or body
    const url = new URL(req.url);
    const queryToken = url.searchParams.get("token");
    let bodyToken: string | undefined;
    try {
      const body = (await req.json()) as ResolveInvitationRequest;
      bodyToken = body?.token;
    } catch (_) {
      // no body
    }

    const token = bodyToken || queryToken;
    if (!token) {
      return new Response(JSON.stringify({ valid: false, error: "Missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("invitations")
      .select("email, status, expires_at, org_id")
      .eq("token", token)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isValid = data.status === "pending" && new Date(data.expires_at) > new Date();

    let orgName: string | null = null;
    if (isValid && data.org_id) {
      const { data: orgData } = await supabase
        .from("org")
        .select("name")
        .eq("id", data.org_id)
        .single();
      orgName = orgData?.name ?? null;
    }

    return new Response(
      JSON.stringify({
        valid: isValid,
        email: isValid ? data.email : null,
        orgName,
        expiresAt: data.expires_at,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (e: any) {
    console.error("resolve-invitation error", e);
    return new Response(JSON.stringify({ valid: false, error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

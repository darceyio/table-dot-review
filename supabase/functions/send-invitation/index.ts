import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  invitationId: string;
  email: string;
  displayName: string;
  orgName: string;
  origin: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Use service role client for database operations to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { invitationId, email, displayName, orgName, origin }: InvitationRequest = await req.json();

    console.log("Sending invitation email", { invitationId, email, orgName, origin });

    // Get invitation token
    const { data: invitation, error: invError } = await supabase
      .from("invitations")
      .select("token")
      .eq("id", invitationId)
      .single();

    if (invError || !invitation) {
      throw new Error("Invitation not found");
    }

    const rawBase = Deno.env.get("APP_BASE_URL") || origin;
    const baseUrl = rawBase.replace(/\/+$/, "");
    const acceptUrl = `${baseUrl}/i/${invitation.token}`;

    const emailResponse = await resend.emails.send({
      from: "Table.Review <invitations@table.review>",
      to: [email],
      subject: `You're invited to join ${orgName} on Table.Review`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 24px;">Welcome to Table.Review!</h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Hi ${displayName},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            You've been invited to join <strong>${orgName}</strong> on Table.Review. Start receiving tips and reviews from customers today!
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${acceptUrl}" style="background-color: #0066FF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 24px; font-size: 16px; font-weight: 600; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; line-height: 1.5; margin-top: 32px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${acceptUrl}" style="color: #0066FF; word-break: break-all;">${acceptUrl}</a>
          </p>
          
          <p style="color: #999; font-size: 14px; line-height: 1.5; margin-top: 24px;">
            This invitation will expire in 7 days.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
          
          <p style="color: #999; font-size: 12px; line-height: 1.5;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

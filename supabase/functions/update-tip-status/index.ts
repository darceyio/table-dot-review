import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_intent_id, status } = await req.json();

    console.log("Updating tip status:", { payment_intent_id, status });

    if (!payment_intent_id) {
      throw new Error("Payment intent ID is required");
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update tip status
    const { data, error } = await supabaseAdmin
      .from("tip")
      .update({
        status: status || "succeeded",
        received_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", payment_intent_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tip:", error);
      throw new Error("Failed to update tip status");
    }

    console.log("Tip status updated:", data.id);

    return new Response(
      JSON.stringify({ success: true, tip: data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Status update error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const {
      amount_cents,
      currency,
      server_id,
      server_assignment_id,
      org_id,
      customer_email,
      cardholder_name,
    } = await req.json();

    console.log("Creating Stripe Payment Intent for tip:", {
      amount_cents,
      currency,
      server_id,
      customer_email,
    });

    // Validate inputs
    if (!amount_cents || amount_cents < 50) {
      throw new Error("Minimum tip amount is 50 cents");
    }

    if (!server_id || !server_assignment_id || !org_id) {
      throw new Error("Missing required server information");
    }

    if (!customer_email || !customer_email.includes("@")) {
      throw new Error("Valid email address is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Initialize Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({
      email: customer_email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: customer_email,
        name: cardholder_name,
        metadata: {
          server_id,
          org_id,
        },
      });
      customerId = customer.id;
    }

    // Create Payment Intent for in-app payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_cents,
      currency: currency.toLowerCase(),
      customer: customerId,
      receipt_email: customer_email,
      metadata: {
        server_id,
        server_assignment_id,
        org_id,
        tip_amount_cents: amount_cents.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create a pending tip record in database
    const { data: tipRecord, error: tipError } = await supabaseAdmin
      .from("tip")
      .insert({
        org_id,
        server_id,
        server_assignment_id,
        amount_cents,
        currency: currency.toUpperCase(),
        source: "stripe",
        status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (tipError) {
      console.error("Error creating tip record:", tipError);
      throw new Error("Failed to create tip record");
    }

    console.log("Tip record created:", tipRecord.id);
    console.log("Payment Intent created:", paymentIntent.id);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Payment creation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

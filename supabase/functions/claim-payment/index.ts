import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { claimLink } = await req.json();

    if (!claimLink) {
      return new Response(
        JSON.stringify({ error: "Missing claim link" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get payment
    const { data: payment, error: fetchError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("claim_link", claimLink)
      .single();

    if (fetchError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if already claimed
    if (payment.status === "claimed") {
      return new Response(
        JSON.stringify({ error: "Payment already claimed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if expired
    if (new Date(payment.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Payment expired" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update payment status
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({
        status: "claimed",
        claimed_by_user_id: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "pending");

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get claimer profile
    const { data: claimerProfile } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("user_id", user.id)
      .single();

    // Notify sender
    const { data: senderProfile } = await supabaseClient
      .from("profiles")
      .select("user_id")
      .eq("email", payment.sender_email)
      .single();

    if (senderProfile) {
      await supabaseClient.from("notifications").insert({
        user_id: senderProfile.user_id,
        type: "payment_claimed",
        title: `✅ Payment of ${payment.amount} ${payment.token} claimed!`,
        message: `${claimerProfile?.email || user.email || "Someone"} claimed your payment of ${payment.amount} ${payment.token}.`,
        payment_id: payment.id,
      });
    }

    // Dispatch webhook event for payment.claimed
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && serviceRoleKey) {
        await fetch(`${supabaseUrl}/functions/v1/webhook-dispatcher`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            event_type: "payment.claimed",
            payment_id: payment.payment_id,
            payload: {
              id: payment.id,
              payment_id: payment.payment_id,
              amount: payment.amount,
              token: payment.token,
              sender_email: payment.sender_email,
              claimer_email: claimerProfile?.email || user.email,
              claimed_at: new Date().toISOString(),
            },
          }),
        });
      }
    } catch (webhookError) {
      console.error("Error dispatching webhook:", webhookError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          token: payment.token,
          senderEmail: payment.sender_email,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error claiming payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../_shared/rateLimit.ts";
import { CreatePaymentSchema, validateSchema } from "../_shared/schemas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders() });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const rateLimit = await checkRateLimit(
      supabaseUrl,
      serviceRoleKey,
      getClientIp(req),
      { maxRequests: 30 }
    );
    
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const supabaseClient = createClient(
      supabaseUrl,
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
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();

    const validation = validateSchema(CreatePaymentSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data",
          details: validation.errors.flatten().fieldErrors 
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    const { recipientEmail, amount, token, memo, senderWallet } = validation.data;

    // Get sender profile
    const { data: senderProfile } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("user_id", user.id)
      .single();

    // Generate unique claim link and secret
    const claimLink = crypto.randomUUID();
    const claimSecret = crypto.randomUUID();
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert payment
    const { data: payment, error: insertError } = await supabaseClient
      .from("payments")
      .insert({
        payment_id: paymentId,
        sender_user_id: user.id,
        sender_email: senderProfile?.email || user.email || "",
        sender_wallet: senderWallet,
        recipient_email: recipientEmail,
        amount,
        token,
        memo,
        claim_link: claimLink,
        claim_secret: claimSecret,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError.message);
      return new Response(
        JSON.stringify({ error: "Failed to create payment. Please try again." }),
        {
          status: 500,
          headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
        }
      );
    }

    // Notify recipient using the database function (in-app notification)
    await supabaseClient.rpc("notify_recipient", {
      p_recipient_email: recipientEmail,
      p_title: `💸 New payment of ${amount} ${token}`,
      p_message: `${senderProfile?.email || "Someone"} sent you ${amount} ${token}${memo ? `: "${memo}"` : ""}`,
      p_payment_id: payment.id,
      p_type: "payment_received",
    });

    // Send email notification with claim link
    const appUrl = Deno.env.get("APP_URL") || "https://peys.io";
    const fullClaimLink = `${appUrl}/claim/${claimLink}`;

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && serviceRoleKey) {
        const notificationResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-payment-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              recipientEmail,
              senderEmail: senderProfile?.email || user.email || "",
              amount,
              token,
              memo,
              claimLink: fullClaimLink,
              appUrl,
            }),
          }
        );

        const notificationResult = await notificationResponse.json();
        console.log("Email notification result:", notificationResult);
      }
    } catch (emailError) {
      console.error("Error sending email notification:", emailError instanceof Error ? emailError.message : "Unknown error");
    }

    // Dispatch webhook event for payment.created
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
            event_type: "payment.created",
            payment_id: payment.payment_id,
            payload: {
              id: payment.id,
              payment_id: payment.payment_id,
              sender_email: senderProfile?.email || user.email || "",
              sender_wallet: senderWallet,
              recipient_email: recipientEmail,
              amount,
              token,
              memo,
              claim_link: fullClaimLink,
              expires_at: expiresAt.toISOString(),
              created_at: payment.created_at,
            },
          }),
        });
      }
    } catch (webhookError) {
      console.error("Error dispatching webhook:", webhookError instanceof Error ? webhookError.message : "Unknown error");
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          paymentId: payment.payment_id,
          claimLink: payment.claim_link,
          amount: payment.amount,
          token: payment.token,
        },
      }),
      {
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating payment:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
      }
    );
  }
});

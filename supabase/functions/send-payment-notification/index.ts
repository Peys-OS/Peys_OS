import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, senderEmail, amount, token, memo, claimLink } =
      await req.json();

    // For now, log the notification (email sending requires domain setup)
    console.log("Payment notification:", {
      to: recipientEmail,
      from: senderEmail,
      amount,
      token,
      memo,
      claimLink,
    });

    // In production, this would send an actual email via the configured email service
    // For now, we just confirm the notification was processed
    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification logged for ${recipientEmail}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

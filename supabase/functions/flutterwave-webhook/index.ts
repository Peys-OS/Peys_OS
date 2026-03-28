import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-verification-hash",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const secretHash = Deno.env.get("FLUTTERWAVE_WEBHOOK_SECRET");
    const signature = req.headers.get("verif-hash");
    
    if (secretHash && signature !== secretHash) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    
    if (body.event === "charge.completed" || body.event === "virtual_account_tx.completed") {
      const data = body.data;
      
      const accountNumber = data.virtual_account_number || data.account_number;
      const amount = data.amount;
      const currency = data.currency;
      const txRef = data.tx_ref || data.id;
      
      const { data: vaData, error: vaError } = await supabaseClient
        .from("virtual_accounts")
        .select("user_id, currency")
        .eq("account_number", accountNumber)
        .single();

      if (vaData && !vaError) {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email")
          .eq("user_id", vaData.user_id)
          .single();

        await supabaseClient.from("fiat_deposits").insert({
          user_id: vaData.user_id,
          amount: amount,
          currency: currency,
          reference: txRef,
          source: "virtual_account",
          account_number: accountNumber,
          status: "completed",
          metadata: data,
        });

        await supabaseClient.from("notifications").insert({
          user_id: vaData.user_id,
          type: "deposit_received",
          title: "💰 Fiat Deposit Received!",
          message: `You received ${currency} ${amount.toLocaleString()} via bank transfer.`,
        });

        await supabaseClient.from("transactions").insert({
          profile_id: vaData.user_id,
          type: "deposit",
          amount: amount,
          currency: currency,
          status: "completed",
          description: `Fiat deposit via virtual account`,
          tx_hash: txRef,
          metadata: {
            source: "flutterwave",
            account_number: accountNumber,
          },
        });
      }
    }

    return new Response(JSON.stringify({ status: "received" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-verification-hash",
};

async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData);
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  
  const sigBuffer = encoder.encode(signature);
  const expectedBuffer = encoder.encode(expectedSignature);
  
  let result = 0;
  for (let i = 0; i < sigBuffer.length; i++) {
    result |= sigBuffer[i] ^ expectedBuffer[i];
  }
  
  return result === 0;
}

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
    const body = await req.text();
    
    if (secretHash) {
      if (!signature) {
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const isValid = await verifyWebhookSignature(body, signature, secretHash);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    const body = JSON.parse(body);
    
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

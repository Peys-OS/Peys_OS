import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WebhookEvent {
  event_type: string;
  payment_id?: string;
  payload: Record<string, unknown>;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const event: WebhookEvent = await req.json();

    // Get all active webhooks that subscribe to this event type
    const { data: webhooks, error } = await supabaseClient
      .from("webhooks")
      .select("id, url, events, secret, is_active")
      .eq("is_active", true)
      .contains("events", [event.event_type]);

    if (error) {
      console.error("Error fetching webhooks:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch webhooks" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${webhooks.length} webhooks for event ${event.event_type}`);

    // Dispatch to each webhook
    const results = await Promise.allSettled(
      webhooks.map((webhook) => dispatchToWebhook(supabaseClient, webhook, event))
    );

    // Log results
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Dispatched to ${successful} webhooks, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        dispatched: successful,
        failed: failed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in webhook dispatcher:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function dispatchToWebhook(
  supabaseClient: any,
  webhook: Webhook,
  event: WebhookEvent
): Promise<void> {
  const deliveryId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Create delivery record
    const { data: delivery } = await supabaseClient
      .from("webhook_deliveries")
      .insert({
        webhook_id: webhook.id,
        event_type: event.event_type,
        payload: event.payload,
        success: false,
      })
      .select()
      .single();

    // Generate signature
    const signature = await generateSignature(webhook.secret, event);

    // Send webhook request
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event.event_type,
        "X-Webhook-ID": webhook.id,
      },
      body: JSON.stringify(event.payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Update delivery record
    await supabaseClient
      .from("webhook_deliveries")
      .update({
        success: response.ok,
        response_status: response.status,
        response_body: await response.text(),
        duration_ms: duration,
      })
      .eq("id", delivery.id);

    // Update webhook last triggered time
    await supabaseClient
      .from("webhooks")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", webhook.id);

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    console.log(`Successfully dispatched to ${webhook.url} in ${duration}ms`);
  } catch (error) {
    console.error(`Failed to dispatch to ${webhook.url}:`, error.message);

    // Update delivery record with failure
    await supabaseClient
      .from("webhook_deliveries")
      .update({
        success: false,
        response_body: error.message,
        retry_count: 0,
      })
      .eq("id", deliveryId);

    throw error;
  }
}

async function generateSignature(secret: string, event: WebhookEvent): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(event));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

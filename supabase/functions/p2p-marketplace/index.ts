import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    switch (action) {
      case "orders":
        return handleOrders(req, supabaseClient);
      case "match":
        return handleMatch(req, supabaseClient);
      case "complete":
        return handleComplete(req, supabaseClient);
      case "dispute":
        return handleDispute(req, supabaseClient);
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("P2P marketplace error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleOrders(req: Request, supabaseClient: any) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const currency = url.searchParams.get("currency");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  let query = supabaseClient
    .from("p2p_orders")
    .select(`
      *,
      creator:auth.users!created_by(id, email, metadata)
    `)
    .eq("status", "open");

  if (type) query = query.eq("type", type);
  if (currency) query = query.eq("currency", currency);

  query = query.order("price_per_usdc", { 
    ascending: type === "buy" ? false : true 
  }).limit(limit);

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ordersWithRating = await Promise.all(
    (data || []).map(async (order: any) => {
      const { data: ratingData } = await supabaseClient.rpc("get_user_p2p_rating", {
        user_uuid: order.created_by,
      });
      return {
        ...order,
        creator_rating: ratingData || 0,
        creator: order.creator ? {
          id: order.creator.id,
          email: order.creator.email,
        } : null,
      };
    })
  );

  return new Response(
    JSON.stringify({ success: true, orders: ordersWithRating }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function handleMatch(req: Request, supabaseClient: any) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: userData } = await supabaseClient.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Invalid user" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { orderId, amountUsdc } = await req.json();

  const { data: order, error: fetchError } = await supabaseClient
    .from("p2p_orders")
    .select("*")
    .eq("id", orderId)
    .eq("status", "open")
    .single();

  if (fetchError || !order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (order.created_by === userData.user.id) {
    return new Response(JSON.stringify({ error: "Cannot match own order" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const matchAmount = amountUsdc || order.amount_usdc;

  const { error: updateError } = await supabaseClient
    .from("p2p_orders")
    .update({
      status: "matched",
      matched_with: userData.user.id,
      matched_at: new Date().toISOString(),
      amount_usdc: matchAmount,
      total_fiat: matchAmount * order.price_per_usdc,
    })
    .eq("id", orderId);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabaseClient.from("notifications").insert({
    user_id: order.created_by,
    type: "p2p_matched",
    title: "P2P Order Matched!",
    message: `Your ${order.type === "sell" ? "sell" : "buy"} order for ${matchAmount} USDC has been matched. Please complete the transaction.`,
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: "Order matched successfully",
      order: { ...order, amount_usdc: matchAmount, total_fiat: matchAmount * order.price_per_usdc },
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function handleComplete(req: Request, supabaseClient: any) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: userData } = await supabaseClient.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Invalid user" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { orderId, action } = await req.json();

  const { data: order, error: fetchError } = await supabaseClient
    .from("p2p_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (order.created_by !== userData.user.id && order.matched_with !== userData.user.id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "confirm") {
    await supabaseClient
      .from("p2p_orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    const otherUserId = order.created_by === userData.user.id ? order.matched_with : order.created_by;

    await supabaseClient.from("notifications").insert({
      user_id: otherUserId,
      type: "p2p_completed",
      title: "P2P Transaction Completed!",
      message: `The P2P transaction for ${order.amount_usdc} USDC has been confirmed.`,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Transaction completed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } else if (action === "cancel") {
    await supabaseClient
      .from("p2p_orders")
      .update({
        status: "cancelled",
      })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ success: true, message: "Transaction cancelled" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleDispute(req: Request, supabaseClient: any) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: userData } = await supabaseClient.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Invalid user" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { orderId, reason, evidence } = await req.json();

  const { data: order, error: fetchError } = await supabaseClient
    .from("p2p_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (order.created_by !== userData.user.id && order.matched_with !== userData.user.id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: disputeError } = await supabaseClient
    .from("p2p_disputes")
    .insert({
      order_id: orderId,
      raised_by: userData.user.id,
      reason,
      evidence,
    });

  if (disputeError) {
    return new Response(JSON.stringify({ error: disputeError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabaseClient
    .from("p2p_orders")
    .update({ status: "disputed" })
    .eq("id", orderId);

  return new Response(
    JSON.stringify({ success: true, message: "Dispute raised" }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

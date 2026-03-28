import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createPublicClient, http, parseAbi } from "viem";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ERC20_ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
]);

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
    const { tokenAddress, ownerAddress, spenderAddress, chainId } = await req.json();

    if (!tokenAddress || !ownerAddress || !spenderAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: tokenAddress, ownerAddress, spenderAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get RPC URL based on chain ID
    const rpcUrl = getRpcUrl(chainId);

    // Create public client
    const publicClient = createPublicClient({
      transport: http(rpcUrl),
    });

    // Get allowance
    const allowance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
    });

    return new Response(
      JSON.stringify({
        allowance: allowance.toString(),
        tokenAddress,
        ownerAddress,
        spenderAddress,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error getting token allowance:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getRpcUrl(chainId?: number): string {
  // Default to Base Sepolia
  if (!chainId) {
    return Deno.env.get("VITE_RPC_URL_BASE_SEPOLIA") || "https://sepolia.base.org";
  }

  // Chain-specific RPC URLs
  const rpcUrls: Record<number, string> = {
    84532: Deno.env.get("VITE_RPC_URL_BASE_SEPOLIA") || "https://sepolia.base.org",
    44787: Deno.env.get("VITE_RPC_URL_CELO") || "https://alfajores-forno.celo-testnet.org",
    420420421: Deno.env.get("VITE_RPC_URL_POLKADOT") || "https://eth-asset-hub-paseo.dotters.network",
    8453: Deno.env.get("VITE_RPC_URL_BASE") || "https://mainnet.base.org",
    42220: Deno.env.get("VITE_RPC_URL_CELO_MAINNET") || "https://forno.celo.org",
  };

  return rpcUrls[chainId] || rpcUrls[84532]!;
}

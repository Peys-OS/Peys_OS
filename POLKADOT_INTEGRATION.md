# Polkadot Stablecoin Integration Guide

## Executive Summary

Your project uses an ERC-20 escrow contract which only supports standard Ethereum-style tokens. However, **Polkadot Asset Hub uses a different asset model** based on Asset IDs rather than contract addresses.

### The Problem

| Asset Type | Polkadot Asset Hub | Ethereum |
|------------|-------------------|----------|
| **Stablecoins (USDC/USDT)** | Asset ID (integer) | ERC-20 contract address |
| **Native token (PASS/DOT)** | Native (no ERC-20) | WETH/WDOT wrapper |

**Your current issue:** `0x00000001000000000000000000000000000007C0` is NOT an ERC-20 contract - it's the Polkadot system assets precompile that doesn't implement `allowance()` or `transferFrom()`.

## Solution Options

### Option 1: Use USDC on Polkadot Asset Hub (Recommended)

**USDC is available on Polkadot Asset Hub with Asset ID 1337**

However, this requires using the **ERC20 Precompile** address format, not a standard contract address.

**Precompile Address Format:**
```
0x0000000000000000000000000000000000000800 + asset_id_padded
```

For USDC (Asset ID 1337 = 0x539):
```
0x0000000000000000000000000000000000000800 + 0x00000000000000000000000000000539
= 0x0000000000000000000000000000000000000D39
```

### Option 2: Use Base Sepolia (Currently Working)

Base Sepolia already has USDC deployed and working with your contract.

**Current USDC on Base Sepolia:**
- Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Your escrow: `0x4a5a67a3666A3f26bF597AdC7c10EA89495e046c`

### Option 3: Deploy WPASS (Wrapped PASS)

Deploy an ERC-20 wrapper contract for PASS tokens on Polkadot.

## Implementation Steps

### Step 1: Update Configuration

**For USDC on Polkadot Asset Hub:**

Update `.env`:
```env
VITE_USDC_ADDRESS_POLKADOT=0x0000000000000000000000000000000000000D39
```

**For PAS on Polkadot Asset Hub:**

Update `.env`:
```env
VITE_PASS_ADDRESS_POLKADOT=0x0000000000000000000000000000000000000801
```
(Using the XC-20 precompile format)

### Step 2: Update chains.ts

Update the Polkadot chain configuration to include the correct USDC address:

```typescript
420420417: {
  // ... existing config
  usdcAddress: "0x0000000000000000000000000000000000000D39" as Address,
  passAddress: "0x0000000000000000000000000000000000000801" as Address,
}
```

### Step 3: Verify Token Availability

Check if USDC has sufficient balance and is approved for your contract.

## Alternative: Use Base Sepolia (Quick Solution)

Since Base Sepolia is already working and USDC is available there, you can:

1. **Keep Polkadot for PASS/ DOT**
2. **Use Base Sepolia for USDC/USDT**
3. **Use Celo for CELO/USDC**

## Recommended Approach for Hackathon

**For immediate testing:**
1. Use **Base Sepolia** for USDC payments (already working)
2. **Disable PASS** on Polkadot until WPASS is deployed
3. Focus on making the core functionality work

**For hackathon judging:**
1. Demonstrate Base Sepolia USDC transfers
2. Show Polkadot PASS balance display
3. Explain the Polkadot asset model in your presentation

## References

- USDC on Polkadot: https://circle.com/blog/usdc-on-polkadot
- Polkadot Asset Hub Assets: https://docs.polkadot.com/reference/polkadot-hub/assets/
- ERC20 Precompile: https://docs.polkadot.com/smart-contracts/precompiles/erc20/

## Quick Commands

```bash
# Send USDC on Base Sepolia
node scripts/send-pass-token.cjs moseschizaram8@gmail.com 2

# Check USDC balance on Polkadot
curl -X POST https://eth-asset-hub-paseo.dotters.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x...","data":"0x70a08231..."},"latest"],"id":1}'
```

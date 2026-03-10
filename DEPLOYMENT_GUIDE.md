# Peys Contract Deployment Guide

This guide explains how to deploy the PeysEscrow smart contract to multiple chains.

## Prerequisites

1. Foundry installed: `curl -L https://foundry.paradigm.xyz | bash`
2. Node.js 18+ installed
3. Private keys for each chain (never commit these to git!)

## Contract Structure

The new contract is located at `contracts/src/PeysEscrow.sol` and uses the name "Peys" instead of "PeyDot".

## Deployment Steps

### 1. Build the Contracts

```bash
npm run contract:build
```

### 2. Run Tests

```bash
npm run contract:test
```

### 3. Deploy to Each Chain

#### Polkadot Asset Hub (Chain ID 420420421)

```bash
# Set environment variables
export PRIVATE_KEY_POLKADOT=your_private_key
export VITE_RPC_URL_POLKADOT=https://eth-asset-hub-paseo.dotters.network

# Deploy
npm run contract:deploy:polkadot
```

#### Celo (Chain ID 42220)

```bash
export PRIVATE_KEY_CELO=your_private_key
export VITE_RPC_URL_CELO=https://forno.celo.org
npm run contract:deploy:celo
```

#### Base (Chain ID 8453)

```bash
export PRIVATE_KEY_BASE=your_private_key
export VITE_RPC_URL_BASE=https://mainnet.base.org
npm run contract:deploy:base
```

### 4. Update Environment Variables

After deployment, update `.env` with the new contract addresses:

```env
# Polkadot Asset Hub
VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT=0xDeployedAddress

# Celo
VITE_ESCROW_CONTRACT_ADDRESS_CELO=0xDeployedAddress

# Base
VITE_ESCROW_CONTRACT_ADDRESS_BASE=0xDeployedAddress
```

## Multi-Chain Architecture

The application now supports multiple chains through:

1. **Chain-aware hooks**: `useEscrow`, `usePayment`, `useAllowance` all accept optional `chainId` parameter
2. **Dynamic contract addresses**: `getChainConfig(chainId)` returns the correct addresses
3. **Wagmi configuration**: All chains are configured in `src/lib/wagmi.ts`

## Testing on Testnets

For testing, use these testnet configurations:

### Base Sepolia (Testnet)
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Faucet: https://www.alchemy.com/faucets/base-sepolia

### Polkadot Paseo (Testnet)
- Chain ID: 420420421
- RPC: https://eth-asset-hub-paseo.dotters.network

## Frontend Integration

The frontend automatically:

1. Detects the user's connected chain
2. Uses the correct contract address for that chain
3. Displays appropriate network information

## Security Notes

- Never expose private keys in frontend code
- Use different keys for each chain
- Consider using a multisig for production deployments
- Verify contracts on block explorers after deployment

## Troubleshooting

### Contract deployment fails
- Ensure you have sufficient gas tokens on the chain
- Check that the RPC URL is correct
- Verify your private key is formatted correctly

### Frontend doesn't recognize deployed contract
- Ensure `.env` file is updated with correct addresses
- Restart the development server after changing `.env`
- Check browser console for connection errors

### Multi-chain switching issues
- Ensure all chains are properly configured in `wagmi.ts`
- Verify contract addresses are set for each chain
- Check that the user's wallet supports the target chain

# Deployed PeysEscrow Contracts

## Testnet Deployments ✅

### 1. Polkadot Asset Hub Testnet
- **Network:** Polkadot Asset Hub (EVM Compatible)
- **Chain ID:** 420420421
- **Contract Address:** `0x802A6843516f52144b3F1D04E5447A085d34aF37`
- **RPC URL:** https://eth-asset-hub-paseo.dotters.network
- **Block Explorer:** https://polkadot.js.org/apps
- **Deployment Date:** March 10, 2026
- **Status:** ✅ Active

### 2. Celo Alfajores Testnet
- **Network:** Celo Alfajores (Testnet)
- **Chain ID:** 44787
- **Contract Address:** `0xe41c86dF5BaCE6bEceD57Ecd916C7aE58a471C02`
- **RPC URL:** https://alfajores-forno.celo-testnet.org
- **Block Explorer:** https://alfajores-blockscout.celo-testnet.org
- **Deployment Date:** March 10, 2026
- **Status:** ✅ Active

### 3. Base Sepolia Testnet
- **Network:** Base Sepolia (Testnet)
- **Chain ID:** 84532
- **Contract Address:** `0x34eD806F9F7D9F8CE1b3d30B665D3cB701a91670`
- **RPC URL:** https://sepolia.base.org
- **Block Explorer:** https://sepolia.basescan.org
- **Deployment Date:** March 10, 2026
- **Status:** ✅ Active

## Mainnet Deployments ⏳

### 1. Polkadot Asset Hub Mainnet
- **Network:** Polkadot Asset Hub (Mainnet)
- **Chain ID:** 420420421
- **Contract Address:** `[To be deployed]`
- **Status:** ⏳ Pending

### 2. Celo Mainnet
- **Network:** Celo Mainnet
- **Chain ID:** 42220
- **Contract Address:** `[To be deployed]`
- **Status:** ⏳ Pending

### 3. Base Mainnet
- **Network:** Base Mainnet
- **Chain ID:** 8453
- **Contract Address:** `[To be deployed]`
- **Status:** ⏳ Pending

## Frontend Configuration

### Update your `.env` file with these addresses:

```env
# Polkadot Asset Hub Testnet
VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT=0x802A6843516f52144b3F1D04E5447A085d34aF37

# Celo Alfajores Testnet
VITE_ESCROW_CONTRACT_ADDRESS_CELO=0xe41c86dF5BaCE6bEceD57Ecd916C7aE58a471C02

# Base Sepolia Testnet
VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA=0x34eD806F9F7D9F8CE1b3d30B665D3cB701a91670
```

## Deployment Commands Used

### Polkadot Asset Hub Testnet:
```bash
cd contracts
source .env
forge script script/DeployPolkadot.s.sol --rpc-url $VITE_RPC_URL_POLKADOT --broadcast
```

### Celo Alfajores Testnet:
```bash
cd contracts
source .env
forge script script/DeployCeloAlfajores.s.sol --rpc-url $VITE_RPC_URL_CELO --broadcast
```

### Base Sepolia Testnet:
```bash
cd contracts
source .env
forge script script/DeployBaseSepolia.s.sol --rpc-url $VITE_RPC_URL_BASE_SEPOLIA --broadcast
```

### Deploy All Testnets:
```bash
cd contracts
source .env
forge script script/DeployTestnets.s.sol --broadcast
```

## Verification Status

All contracts have been deployed successfully. Verification on block explorers may require additional steps depending on the network.

## Next Steps

1. **Test the contracts** on each testnet
2. **Deploy to mainnets** when ready for production
3. **Update frontend** with correct network configurations
4. **Monitor contract activity** across all networks

## Contract Source Code

The source code is available at:
- `contracts/src/PeysEscrow.sol`
- Verified on block explorers where supported

# Environment Variables Reference

## 📋 Quick Reference Table

| Variable Name | Network | Required For | Example Value |
|---------------|---------|--------------|---------------|
| `PRIVATE_KEY_POLKADOT` | Polkadot Asset Hub | Deployment | `0x...` (64 hex chars) |
| `PRIVATE_KEY_CELO` | Celo Mainnet | Deployment | `0x...` (64 hex chars) |
| `PRIVATE_KEY_BASE` | Base Mainnet | Deployment | `0x...` (64 hex chars) |
| `VITE_RPC_URL_POLKADOT` | Polkadot Asset Hub | RPC Connection | `https://eth-asset-hub-paseo.dotters.network` |
| `VITE_RPC_URL_CELO` | Celo Mainnet | RPC Connection | `https://forno.celo.org` |
| `VITE_RPC_URL_BASE_SEPOLIA` | Base Sepolia | RPC Connection | `https://sepolia.base.org` |
| `VITE_RPC_URL_BASE` | Base Mainnet | RPC Connection | `https://mainnet.base.org` |
| `POLKADOT_EXPLORER_API_KEY` | Polkadot | Contract Verification | `your_api_key` |
| `CELOSCAN_API_KEY` | Celo | Contract Verification | `your_api_key` |
| `BASESCAN_API_KEY` | Base | Contract Verification | `your_api_key` |

## 🔐 Required Environment Variables for Deployment

### 1. **Polkadot Asset Hub (Chain ID: 420420421)**
```env
# Private key for deployment (REQUIRED)
PRIVATE_KEY_POLKADOT=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# RPC URL (REQUIRED)
VITE_RPC_URL_POLKADOT=https://eth-asset-hub-paseo.dotters.network

# Block explorer API key (OPTIONAL for verification)
POLKADOT_EXPLORER_API_KEY=your_polkadot_explorer_api_key
```

### 2. **Celo Mainnet (Chain ID: 42220)**
```env
# Private key for deployment (REQUIRED)
PRIVATE_KEY_CELO=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# RPC URL (REQUIRED)
VITE_RPC_URL_CELO=https://forno.celo.org

# CeloScan API key (REQUIRED for verification)
CELOSCAN_API_KEY=your_celoscan_api_key
```

### 3. **Base Sepolia Testnet (Chain ID: 84532)**
```env
# RPC URL (REQUIRED)
VITE_RPC_URL_BASE_SEPOLIA=https://sepolia.base.org

# BaseScan API key (REQUIRED for verification)
BASESCAN_API_KEY=your_basescan_api_key

# NOTE: Uses built-in test account, no private key needed
```

### 4. **Base Mainnet (Chain ID: 8453)**
```env
# Private key for deployment (REQUIRED)
PRIVATE_KEY_BASE=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# RPC URL (REQUIRED)
VITE_RPC_URL_BASE=https://mainnet.base.org

# BaseScan API key (REQUIRED for verification)
BASESCAN_API_KEY=your_basescan_api_key
```

## 📝 Complete .env File Template

```env
# ============================================
# PEYS ESCROW CONTRACT DEPLOYMENT
# ============================================

# --------------------------------------------
# POLKADOT ASSET HUB (Chain ID: 420420421)
# --------------------------------------------
PRIVATE_KEY_POLKADOT=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
VITE_RPC_URL_POLKADOT=https://eth-asset-hub-paseo.dotters.network
POLKADOT_EXPLORER_API_KEY=your_polkadot_explorer_api_key

# --------------------------------------------
# CELO MAINNET (Chain ID: 42220)
# --------------------------------------------
PRIVATE_KEY_CELO=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
VITE_RPC_URL_CELO=https://forno.celo.org
CELOSCAN_API_KEY=your_celoscan_api_key

# --------------------------------------------
# BASE SEPOLIA TESTNET (Chain ID: 84532)
# --------------------------------------------
VITE_RPC_URL_BASE_SEPOLIA=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key

# --------------------------------------------
# BASE MAINNET (Chain ID: 8453)
# --------------------------------------------
PRIVATE_KEY_BASE=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
VITE_RPC_URL_BASE=https://mainnet.base.org

# ============================================
# FRONTEND VARIABLES (Optional)
# ============================================
VITE_PRIVY_APP_ID=your_privy_app_id
```

## 🚀 Deployment Commands

### Individual Network Deployment:
```bash
# Polkadot Asset Hub
export PRIVATE_KEY_POLKADOT=your_key
npm run contract:deploy:polkadot

# Celo Mainnet
export PRIVATE_KEY_CELO=your_key
npm run contract:deploy:celo

# Base Sepolia
npm run contract:deploy:base

# Base Mainnet
export PRIVATE_KEY_BASE=your_key
npm run contract:deploy:base
```

### Multi-Chain Deployment:
```bash
# Deploy to all networks at once
export PRIVATE_KEY_POLKADOT=your_key
export PRIVATE_KEY_CELO=your_key
export PRIVATE_KEY_BASE=your_key
npm run contract:deploy:all
```

## 🔑 Getting API Keys

### CeloScan (Celo Mainnet)
1. Go to https://celoscan.io
2. Click "Register" or "Sign In"
3. Create an account
4. Go to "My Profile" → "API Keys"
5. Create a new API key

### BaseScan (Base Mainnet & Sepolia)
1. Go to https://basescan.org
2. Click "Register" or "Sign In"
3. Create an account
4. Go to "My Profile" → "API Keys"
5. Create a new API key

### Polkadot Explorer
- Check network-specific documentation
- May require different verification process

## ⚠️ Security Notes

### Private Keys:
- **NEVER commit private keys to git**
- **Use different keys for each network**
- **Consider using multisig for production**
- **Test with small amounts first**

### API Keys:
- **Never expose API keys in frontend code**
- **Use environment variables only**
- **Rotate keys periodically**
- **Restrict keys to specific networks if possible**

## 📊 Network Information

| Network | Chain ID | RPC URL | Block Explorer |
|---------|----------|---------|----------------|
| Polkadot Asset Hub | 420420421 | https://eth-asset-hub-paseo.dotters.network | https://polkadot.js.org/apps |
| Celo Mainnet | 42220 | https://forno.celo.org | https://celoscan.io |
| Base Sepolia | 84532 | https://sepolia.base.org | https://sepolia.basescan.org |
| Base Mainnet | 8453 | https://mainnet.base.org | https://basescan.org |

## 🔍 Verification After Deployment

After deployment, you can verify the contract using:

```bash
# Polkadot Asset Hub
forge verify-contract <CONTRACT_ADDRESS> PeysEscrow --chain-id 420420421

# Celo Mainnet
forge verify-contract <CONTRACT_ADDRESS> PeysEscrow --chain-id 42220 --etherscan-api-key $CELOSCAN_API_KEY

# Base Sepolia
forge verify-contract <CONTRACT_ADDRESS> PeysEscrow --chain-id 84532 --etherscan-api-key $BASESCAN_API_KEY

# Base Mainnet
forge verify-contract <CONTRACT_ADDRESS> PeysEscrow --chain-id 8453 --etherscan-api-key $BASESCAN_API_KEY
```

## 📝 Next Steps

1. **Create `.env` file** in the `contracts/` folder
2. **Fill in your private keys** for each network
3. **Get API keys** from block explorers
4. **Run deployment commands** for each network
5. **Verify contracts** after deployment
6. **Update frontend** with deployed contract addresses

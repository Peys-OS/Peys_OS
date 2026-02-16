# PeyDot - Project Roadmap & Phases

## Project Overview
PeyDot is a P2P and merchant payments app using stablecoins (USDC/USDT) on Polkadot Asset Hub with "Magic Claim Links" for zero-friction onboarding.

---

## Phase 1: Foundation & Smart Contracts (Week 1-2)

### Goals
- Set up Foundry development environment
- Deploy Escrow smart contract to testnet
- Create deployment scripts

### Deliverables
1. **Smart Contract (`contracts/PeyDotEscrow.sol`)**
   - `createPayment()` - Sender deposits funds into escrow
   - `claim()` - Recipient claims funds via magic link
   - `refundAfterExpiry()` - Auto-refund if unclaimed
   - Events for tracking

2. **Test Suite**
   - Unit tests for all contract functions
   - Integration tests

3. **Deployment**
   - Deploy to Polkadot Hub testnet (Paseo)
   - Configuration for different networks

---

## Phase 2: Backend & Database (Week 2-3)

### Goals
- Set up API routes for escrow management
- Create payment link storage
- Implement authentication

### Deliverables
1. **API Routes**
   - `POST /api/escrow/create` - Create payment link
   - `GET /api/escrow/:id` - Get payment details
   - `POST /api/escrow/:id/claim` - Claim payment
   - `POST /api/escrow/:id/refund` - Refund if expired

2. **Database (SQLite/PostgreSQL)**
   - Store payment links with metadata
   - Track claim status
   - Transaction history

---

## Phase 3: Frontend Integration (Week 3-4)

### Goals
- Integrate Privy for authentication
- Connect to smart contracts via wagmi/viem
- Build all UI flows

### Deliverables
1. **Privy Integration**
   - `PrivyProvider.tsx` - Auth wrapper
   - Email/Google/Apple login
   - Embedded wallet creation

2. **Wallet Connection**
   - Display wallet address
   - Show USDC/USDT balances
   - Transaction signing

3. **Pages**
   - `/` - Landing page (existing)
   - `/send` - Send payment flow
   - `/claim/:id` - Claim payment flow
   - `/dashboard` - User dashboard

---

## Phase 4: XCM & Stablecoin Integration (Week 4-5)

### Goals
- Integrate with Polkadot Asset Hub
- Support USDC/USDT transfers
- XCM precompiles for cross-chain

### Deliverables
1. **Token Integration**
   - ERC20 interface for USDC/USDT
   - Balance queries
   - Transfer functions

2. **Gas Sponsorship**
   - Configure gas relayer
   - Optional: Gelato automation

---

## Phase 5: Polish & Demo (Week 5-6)

### Goals
- Complete UI polish
- Error handling
- Demo walkthrough

### Deliverables
1. **UI/UX Improvements**
   - Loading states
   - Error toasts
   - Mobile responsiveness

2. **Documentation**
   - README with setup
   - Demo script for judges

3. **Testing**
   - End-to-end flows
   - Bug fixes

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Privy.io |
| Smart Contracts | Solidity + Foundry |
| Chain | Polkadot Hub (EVM) |
| Wallet | Privy Embedded (ERC-4337) |
| Data Fetching | TanStack Query |
| State | React Context |

---

## File Structure

```
peydot-magic-links/
├── contracts/                 # Solidity contracts
│   ├── PeyDotEscrow.sol
│   └── ...
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── SendPaymentForm.tsx
│   │   └── ...
│   ├── contexts/             # React contexts
│   │   └── AppContext.tsx
│   ├── hooks/               # Custom hooks
│   │   └── useMockData.ts
│   ├── pages/               # Route pages
│   │   ├── Index.tsx
│   │   ├── SendPage.tsx
│   │   ├── ClaimPage.tsx
│   │   └── DashboardPage.tsx
│   └── lib/                 # Utilities
├── foundry/                 # Foundry configuration
│   ├── foundry.toml
│   └── script/             # Deployment scripts
├── package.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Foundry
- Privy App ID (get from privy.io)
- RPC URL for Polkadot Hub testnet

### Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development
npm run dev
```

### Smart Contract Development
```bash
# Build contracts
forge build

# Run tests
forge test

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

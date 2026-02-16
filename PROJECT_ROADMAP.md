# PeyDot - Project Roadmap & Phases

## Project Overview
PeyDot is a P2P and merchant payments app using stablecoins (USDC/USDT) on Polkadot Asset Hub with "Magic Claim Links" for zero-friction onboarding.

---

## Phase 1: Foundation & Smart Contracts (Week 1-2) ✅ COMPLETED

### Goals
- Set up Foundry development environment
- Deploy Escrow smart contract to testnet
- Create deployment scripts

### Deliverables
1. **Smart Contract (`contracts/PeyDotEscrow.sol`)**
   - `createPaymentExternal()` - Sender deposits funds into escrow (custom expiry)
   - `createPaymentWithDefaultExpiry()` - Sender deposits funds (7-day default)
   - `claim()` - Recipient claims funds via magic link
   - `refundAfterExpiry()` - Auto-refund if unclaimed
   - `getPayment()` - View payment details
   - `isPaymentExpired()` - Check expiry status
   - Events for tracking (PaymentCreated, PaymentClaimed, PaymentRefunded)

2. **Test Suite**
   - ✅ Unit tests for all contract functions (11 tests passing)
   - ✅ Integration tests
   - ✅ MockERC20 for testing

3. **Deployment**
   - ✅ `script/Deploy.s.sol` - Deployment script
   - ✅ `foundry.toml` - Foundry configuration
   - ⏳ Deploy to Polkadot Hub testnet (Paseo)

---

## Phase 2: Backend & Database (Week 2-3) 🔄 IN PROGRESS

### Goals
- Set up API routes for escrow management
- Create payment link storage
- Implement authentication

### Deliverables
1. **API Routes** (Planned)
   - `POST /api/escrow/create` - Create payment link
   - `GET /api/escrow/:id` - Get payment details
   - `POST /api/escrow/:id/claim` - Claim payment
   - `POST /api/escrow/:id/refund` - Refund if expired

2. **Database (SQLite/PostgreSQL)** (Planned)
   - Store payment links with metadata
   - Track claim status
   - Transaction history

---

## Phase 3: Frontend Integration (Week 3-4) ✅ COMPLETED

### Goals
- Integrate Privy for authentication
- Connect to smart contracts via wagmi/viem
- Build all UI flows

### Deliverables
1. **Privy Integration**
   - ✅ `src/contexts/PrivyContext.tsx` - Auth wrapper with embedded wallets
   - ✅ Email/Google/Apple login
   - ✅ Embedded wallet creation on first login

2. **Wallet Connection**
   - ✅ Display wallet address
   - ✅ Show USDC/USDT balances
   - ✅ Transaction signing via useEscrow hook

3. **Pages**
   - ✅ `/` - Landing page
   - ✅ `/send` - Send payment flow
   - ✅ `/claim/:id` - Claim payment flow
   - ✅ `/dashboard` - User dashboard

4. **Blockchain Integration**
   - ✅ `src/lib/wagmi.ts` - Wagmi configuration
   - ✅ `src/lib/abis.ts` - Contract ABIs
   - ✅ `src/lib/contracts.ts` - Contract addresses
   - ✅ `src/hooks/useEscrow.ts` - Escrow contract interactions

---

## Phase 4: XCM & Stablecoin Integration (Week 4-5) 🔄 IN PROGRESS

### Goals
- Integrate with Polkadot Asset Hub
- Support USDC/USDT transfers
- XCM precompiles for cross-chain

### Deliverables
1. **Token Integration**
   - ✅ ERC20 interface for USDC/USDT
   - ⏳ Balance queries (mock data currently)
   - ⏳ Transfer functions (via escrow)

2. **Gas Sponsorship** (Planned)
   - Configure gas relayer
   - Optional: Gelato automation

---

## Phase 5: Polish & Demo (Week 5-6) 🔄 IN PROGRESS

### Goals
- Complete UI polish
- Error handling
- Demo walkthrough

### Deliverables
1. **UI/UX Improvements**
   - ✅ Loading states (via Privy)
   - ✅ Error toasts (react-hot-toast/sonner)
   - ✅ Mobile-first design

2. **Documentation**
   - ✅ README with setup
   - ✅ Demo script for judges
   - ✅ Contributing guidelines
   - ✅ Support documentation
   - ✅ Code of Conduct

3. **Testing**
   - ✅ Smart contract tests (11 passing)
   - ⏳ End-to-end flows
   - ⏳ Bug fixes

---

## Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | React 18 + Vite + TypeScript | ✅ |
| Styling | Tailwind CSS + shadcn/ui | ✅ |
| Auth | Privy.io | ✅ |
| Smart Contracts | Solidity 0.8.20 + Foundry | ✅ |
| Chain | Polkadot Hub (EVM) | ✅ |
| Wallet | Privy Embedded (ERC-4337) | ✅ |
| Data Fetching | TanStack Query | ✅ |
| State | React Context | ✅ |
| Chain Interaction | Wagmi + Viem | ✅ |

---

## File Structure

```
peydot-magic-links/
├── contracts/                 # Solidity contracts
│   ├── PeyDotEscrow.sol      # Main escrow contract
│   └── ...
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── SendPaymentForm.tsx
│   │   └── ...
│   ├── contexts/             # React contexts
│   │   ├── PrivyContext.tsx  # Privy authentication ✅ NEW
│   │   └── AppContext.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useEscrow.ts     # Escrow contract hooks ✅ NEW
│   │   └── useMockData.ts
│   ├── lib/                 # Utilities
│   │   ├── abis.ts         # Contract ABIs ✅ NEW
│   │   ├── contracts.ts    # Contract addresses ✅ NEW
│   │   └── wagmi.ts        # Wagmi config ✅ NEW
│   └── pages/               # Route pages
│       ├── Index.tsx
│       ├── SendPage.tsx
│       ├── ClaimPage.tsx
│       └── DashboardPage.tsx
├── script/                    # Foundry scripts
│   └── Deploy.s.sol         # Deployment script ✅
├── test/                      # Foundry tests
│   └── PeyDotEscrow.t.sol  # Contract tests ✅
├── foundry.toml              # Foundry config ✅
├── .env                      # Environment variables ✅
└── package.json
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

# Set up environment (already configured with your Privy app ID)
# Edit .env if needed

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

---

## Smart Contract Functions

### PeyDotEscrow.sol

```solidity
// Create payment with custom expiry (1-30 days)
function createPaymentExternal(
    address token,
    uint256 amount,
    bytes32 claimHash,
    uint256 expiry,
    string calldata memo
) external returns (bytes32 paymentId);

// Create payment with default 7-day expiry
function createPaymentWithDefaultExpiry(
    address token,
    uint256 amount,
    bytes32 claimHash,
    string calldata memo
) external returns (bytes32 paymentId);

// Claim funds
function claim(
    bytes32 paymentId,
    bytes32 secretHash,
    address recipient
) external returns (uint256);

// Refund after expiry
function refundAfterExpiry(bytes32 paymentId) external;

// View payment details
function getPayment(bytes32 paymentId) external view returns (
    address sender,
    address token,
    uint256 amount,
    uint256 expiry,
    bool claimed,
    bool refunded,
    string memory memo
);
```

---

## Test Results

```
Ran 11 tests for test/PeyDotEscrow.t.sol:PeyDotEscrowTest
[PASS] testCannotClaimExpiredPayment()
[PASS] testCannotRefundBeforeExpiry()
[PASS] testCannotRefundByNonSender()
[PASS] testClaimPayment()
[PASS] testClaimWithWrongHash()
[PASS] testCreatePayment()
[PASS] testCreatePaymentWithCustomExpiry()
[PASS] testInvalidExpiry()
[PASS] testPaymentNotFound()
[PASS] testRefundAfterExpiry()
[PASS] testZeroAmount()
Suite result: ok. 11 passed; 0 failed; 0 skipped
```

---

## Next Steps

1. **Deploy to testnet** - Run deployment script to Polkadot Hub testnet
2. **Set up backend** - Implement API routes for payment management
3. **Add real token balances** - Connect to USDC/USDT on testnet
4. **End-to-end testing** - Test full payment flow
5. **Production deployment** - Deploy to production

---

## Resources

- [Polkadot Documentation](https://docs.polkadot.com/)
- [Privy Documentation](https://docs.privy.io/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Wagmi Documentation](https://wagmi.sh/)

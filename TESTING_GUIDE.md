# Testing Guide

This guide provides instructions for testing the PeyDot application after the hybrid architecture implementation.

## Prerequisites

1. Node.js (v18+)
2. npm or yarn
3. Git
4. Supabase account (for testing Edge Functions)
5. Privy account (for authentication)
6. Test wallet with testnet ETH and USDC

## Setup Commands

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Moses-main/peydot-magic-links.git
cd peydot-magic-links

# Install dependencies
npm install

# Install dependencies for WhatsApp service
cd whatsapp
npm install
cd ..
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Privy Configuration
VITE_PRIVY_APP_ID=your-privy-app-id

# Blockchain (Testnet)

## Base Sepolia
VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA=***REMOVED***
VITE_USDC_ADDRESS_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
VITE_RPC_URL_BASE_SEPOLIA=https://base-sepolia.g.alchemy.com/v2/your-key

## Celo Alfajores
VITE_ESCROW_CONTRACT_ADDRESS_CELO=***REMOVED***
VITE_USDC_ADDRESS_CELO=0x01C5C0122039549AD1493B8220cABEdD739BC44E
VITE_RPC_URL_CELO=https://celo-sepolia.g.alchemy.com/v2/your-key

## Polkadot Asset Hub (Paseo)
VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT=***REMOVED***
VITE_PASS_ADDRESS_POLKADOT=0x00000000000000000000000000000000000007C0
VITE_RPC_URL_POLKADOT=https://eth-asset-hub-paseo.dotters.network

# WhatsApp Service
WHATSAPP_SERVICE_URL=http://localhost:3002
WHATSAPP_SERVICE_SECRET=your-secret

# App URL
APP_URL=http://localhost:5173
```

### 3. Supabase Setup

```bash
# Login to Supabase CLI
npx supabase login

# Start Supabase locally (for testing)
npx supabase start

# Or use remote Supabase project
# Update .env with your project URL and keys
```

### 4. Database Schema

```bash
# Push database schema to Supabase
npx supabase db push
```

## Testing Commands

### 1. Unit Tests

```bash
# Run unit tests (if using Vitest)
npm run test

# Run tests with coverage
npm run test:coverage
```

### 2. Linting

```bash
# Check for TypeScript errors and linting issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### 3. Type Checking

```bash
# Run TypeScript type checking
npm run typecheck
```

### 4. Build Tests

```bash
# Build for production (tests compilation)
npm run build

# Preview the built application
npm run preview
```

### 5. Development Server

```bash
# Start development server
npm run dev

# Start WhatsApp service (separate terminal)
cd whatsapp
npm run dev
```

### 6. Supabase Edge Functions Testing

```bash
# Deploy functions to Supabase
npx supabase functions deploy

# Test functions locally
npx supabase functions serve
```

## Feature Testing Checklist

### ✅ Core Features

#### 1. User Authentication
- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Connect wallet via Privy
- [ ] Auto-create embedded wallet
- [ ] View user profile

#### 2. Payment Flow (Magic Link)
- [ ] Create payment (send page)
- [ ] Enter recipient email
- [ ] Select token (USDC/USDT)
- [ ] Enter amount
- [ ] Add memo (optional)
- [ ] Confirm transaction
- [ ] Receive claim link in email
- [ ] Claim payment as recipient
- [ ] View payment in dashboard

#### 3. Batch Payments
- [ ] Upload CSV file
- [ ] Review recipients
- [ ] Process batch payments
- [ ] View progress
- [ ] Check individual statuses

#### 4. Streaming Payments
- [ ] Create payment stream
- [ ] Set rate per second
- [ ] Set duration
- [ ] View active streams
- [ ] Monitor stream progress

#### 5. Developer Platform
- [ ] Create API key
- [ ] View API key details
- [ ] Test webhook registration
- [ ] Send test webhook events
- [ ] View delivery logs

### ✅ Integration Tests

#### 1. Supabase Edge Functions
```bash
# Test create-payment function
curl -X POST https://your-project.supabase.co/functions/v1/create-payment \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "0x...",
    "recipientEmail": "test@example.com",
    "tokenAddress": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "amount": "10",
    "secret": "test-secret-123"
  }'
```

#### 2. Webhook System
```bash
# Test webhook registration
curl -X POST https://your-project.supabase.co/functions/v1/webhook-register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["payment.created", "payment.claimed"]
  }'
```

#### 3. WhatsApp Integration
```bash
# Start WhatsApp service
cd whatsapp
npm run dev

# Test QR code generation
curl -X POST http://localhost:3002/whatsapp/login
```

### ✅ Browser Testing

#### 1. Frontend Components
- [ ] Mobile responsive design
- [ ] Desktop layout
- [ ] Navigation works
- [ ] Forms validate properly
- [ ] Loading states display
- [ ] Error messages show correctly

#### 2. Wallet Integration
- [ ] Privy login modal opens
- [ ] Wallet connects successfully
- [ ] Balance displays correctly
- [ ] Transaction signing works

#### 3. Email Notifications
- [ ] Payment created email sends
- [ ] Claim link works
- [ ] Email arrives in inbox

## Test Data

### Test Wallet Addresses (Base Sepolia)
```
Test Wallet 1: 0x1234...5678
Test Wallet 2: 0xabcd...efgh
```

### Test Token Addresses (Base Sepolia)
```
USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
USDT: 0x0000000000000000000000000000000000000001
```

### Test Recipient Emails
```
test1@example.com
test2@example.com
```

## Debugging Commands

### Check Logs
```bash
# Frontend logs
npm run dev 2>&1 | tee dev.log

# Supabase logs
npx supabase functions logs
```

### Check API Status
```bash
# Health check
curl https://your-project.supabase.co/functions/v1/health

# Check webhook status
curl https://your-project.supabase.co/functions/v1/webhook-status
```

### Test Database Connection
```bash
# Check if functions can connect to database
npx supabase functions serve
```

## Performance Testing

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 10 --num 50 http://localhost:5173
```

### Build Time Test
```bash
# Time the build
time npm run build
```

### Function Execution Time
```bash
# Test function execution time
time curl -X POST https://your-project.supabase.co/functions/v1/create-payment \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"senderAddress":"0x...","recipientEmail":"test@example.com","tokenAddress":"0x...","amount":"10","secret":"test"}'
```

## Troubleshooting

### Common Issues

1. **Build fails with TypeScript errors**
   ```bash
   npm run typecheck
   # Fix any errors shown
   ```

2. **Supabase functions not deploying**
   ```bash
   npx supabase login
   npx supabase functions deploy --project-ref your-project-id
   ```

3. **WhatsApp service not connecting**
   ```bash
   cd whatsapp
   npm run dev
   # Check if port 3002 is available
   ```

4. **Wallet not connecting**
   - Check Privy app ID in .env
   - Ensure VITE_PRIVY_APP_ID is set
   - Clear browser cache

### Environment Variables Check
```bash
# Check if all required variables are set
node -e "console.log(process.env.VITE_SUPABASE_URL ? '✅ Supabase URL set' : '❌ Supabase URL missing')"
```

## Continuous Testing

### Pre-commit Hooks
```bash
# Run before committing
npm run lint
npm run typecheck
npm run build
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
```

## Test Results Template

```markdown
## Test Results - [Date]

### Core Features
- [ ] Authentication: PASS/FAIL
- [ ] Payments: PASS/FAIL
- [ ] Batch Payments: PASS/FAIL
- [ ] Streaming: PASS/FAIL
- [ ] Webhooks: PASS/FAIL

### Integration Tests
- [ ] Supabase Functions: PASS/FAIL
- [ ] WhatsApp Service: PASS/FAIL
- [ ] Email Notifications: PASS/FAIL

### Performance
- Build Time: X seconds
- Function Execution: X ms average
- Bundle Size: X MB

### Issues Found
- [Issue 1]: Description
- [Issue 2]: Description

### Notes
[Any additional observations]
```

## Contact

For testing support or issues:
- GitHub Issues: https://github.com/Moses-main/peydot-magic-links/issues
- Documentation: See ARCHITECTURE.md and MIGRATION_PLAN.md

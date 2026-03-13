# API Migration Plan: Express → Supabase Edge Functions

## Overview
Migrate REST API endpoints from Express server to Supabase Edge Functions to reduce costs and consolidate the backend.

## Current State

### Express Server Endpoints (`/server/`)
```
POST /api/escrow/create          - Create payment
GET  /api/escrow/:id             - Get payment
POST /api/escrow/:id/claim       - Claim payment
GET  /api/escrow/user/:wallet    - Get user payments
GET  /api/escrow/token/:address/balance/:wallet - Get token balance
GET  /api/escrow/token/:address/allowance/:owner - Get allowance
POST /api/users/sync             - Sync user data
GET  /api/users/:id              - Get user by ID
GET  /api/users/wallet/:address  - Get user by wallet
```

### Existing Supabase Edge Functions
```
POST /functions/v1/create-payment       - ✅ Already exists
POST /functions/v1/claim-payment        - ✅ Already exists
POST /functions/v1/get-payment          - ✅ Already exists
POST /functions/v1/get-user-payments    - ✅ Already exists
POST /functions/v1/public-api           - ✅ Already exists (developer API)
POST /functions/v1/send-payment-notif   - ✅ Already exists
POST /functions/v1/webhook-register     - ✅ Created
POST /functions/v1/webhook-dispatcher   - ✅ Created
```

## Migration Tasks

### Phase 1: Create Missing Edge Functions

#### 1. `get-token-balance` Function
**Location**: `/supabase/functions/get-token-balance/index.ts`

**Purpose**: Get ERC20 token balance for a wallet address

**Input**:
```json
{
  "tokenAddress": "0x...",
  "walletAddress": "0x..."
}
```

**Output**:
```json
{
  "balance": "1000000000"
}
```

**Implementation**:
- Use viem library (already in dependencies)
- Call `balanceOf` on ERC20 contract
- Return formatted balance

#### 2. `get-token-allowance` Function
**Location**: `/supabase/functions/get-token-allowance/index.ts`

**Purpose**: Get ERC20 token allowance for a wallet address

**Input**:
```json
{
  "tokenAddress": "0x...",
  "ownerAddress": "0x...",
  "spenderAddress": "0x..."
}
```

**Output**:
```json
{
  "allowance": "1000000000"
}
```

**Implementation**:
- Use viem library
- Call `allowance` on ERC20 contract
- Return formatted allowance

#### 3. `sync-user` Function
**Location**: `/supabase/functions/sync-user/index.ts`

**Purpose**: Sync user data with Supabase profiles table

**Input**:
```json
{
  "privyId": "...",
  "email": "...",
  "phone": "...",
  "name": "...",
  "walletAddress": "...",
  "walletType": "...",
  "chainId": ...
}
```

**Output**:
```json
{
  "id": "...",
  "email": "...",
  "name": "...",
  "walletAddress": "..."
}
```

**Implementation**:
- Upsert into `profiles` table
- Use Supabase Auth to get user ID
- Return user data

### Phase 2: Update Frontend API Client

**File**: `/src/lib/api.ts`

**Changes**:
1. Update `API_URL` to point to Supabase functions
2. Update all endpoint paths
3. Add Supabase Auth headers

**New API URL**:
```typescript
const API_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';
```

**Updated Endpoints**:
```typescript
// Before
POST /api/escrow/create
POST /api/escrow/:id/claim
GET  /api/escrow/user/:wallet

// After
POST /create-payment
POST /claim-payment
POST /get-user-payments
```

### Phase 3: Update Environment Variables

**Frontend (.env)**:
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxx
VITE_PRIVY_APP_ID=xxx
# Remove: VITE_API_URL
```

**WhatsApp Service (.env)**:
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
WHATSAPP_SERVICE_URL=http://localhost:3002
# Remove: ESCROW_CONTRACT_ADDRESS (use Supabase functions)
```

### Phase 4: Update WhatsApp Service Integration

**Current Flow**:
1. WhatsApp service calls Express server API
2. Express server creates payment

**New Flow**:
1. WhatsApp service calls Supabase Edge Functions
2. Supabase creates payment and returns result

**WhatsApp Service Changes**:
```javascript
// Before
const API_URL = 'http://localhost:3001/api';

// After
const API_URL = process.env.SUPABASE_URL + '/functions/v1';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Add auth header
const headers = {
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};
```

### Phase 5: Deprecate Express Server

**After migration**:
1. Express server only runs for WhatsApp service (port 3002)
2. Payment/user APIs moved to Supabase
3. Update `.env.example` files
4. Add deprecation notice to Express server

## Timeline

### Week 1
- [ ] Create `get-token-balance` Edge Function
- [ ] Create `get-token-allowance` Edge Function
- [ ] Create `sync-user` Edge Function
- [ ] Update API client in frontend

### Week 2
- [ ] Test all migrated endpoints
- [ ] Update WhatsApp service integration
- [ ] Update environment variables
- [ ] Add monitoring for Supabase functions

### Week 3
- [ ] Deprecate Express server for payment APIs
- [ ] Update documentation
- [ ] Monitor costs and performance

## Testing Plan

### Unit Tests
1. Test `get-token-balance` with mock contract calls
2. Test `get-token-allowance` with mock contract calls
3. Test `sync-user` with mock Supabase calls

### Integration Tests
1. Test full payment flow via Supabase
2. Test WhatsApp integration
3. Test developer API endpoints

### Performance Tests
1. Measure function execution time
2. Monitor Supabase invocation counts
3. Compare costs with Express server

## Cost Analysis

### Current (Express Server)
- VPS: $20/month (24/7)
- Database: $15/month
- **Total: $35/month**

### After Migration
- WhatsApp Service (VPS): $5-10/month
- Supabase Free: $0 (500K invocations)
- Supabase Pro (if needed): $25/month
- **Total: $5-35/month**

**Savings: $0-30/month** depending on usage

## Rollback Plan

If migration causes issues:
1. Update `VITE_API_URL` to point back to Express server
2. Restore Express server endpoints
3. Update WhatsApp service to use Express server

## Success Metrics

- [ ] All API endpoints working via Supabase
- [ ] Function execution time < 500ms
- [ ] Supabase invocation count within free tier
- [ ] WhatsApp service working correctly
- [ ] No regression in user experience

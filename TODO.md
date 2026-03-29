# TODO.md - Security Audit Continuation Guide

## Context for Next Session

### What is Peys OS?

**Peys OS** is a **cross-chain stablecoin payment platform** that enables users to send USDC/USDT/PASS to anyone via "magic claim links" — no wallet required on the recipient's end. Built on Base, Celo, and Polkadot networks.

### Core Functionality
- **Magic Link Payments**: Send crypto via email link, recipient claims without wallet
- **Multi-chain Support**: Base, Celo, Polkadot Asset Hub
- **WhatsApp Integration**: Bot for payments via WhatsApp messages
- **Developer API**: REST API with webhooks for payment events
- **P2P Marketplace**: Peer-to-peer stablecoin trading

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| Auth | Privy (wallet + social login) |
| Backend | Supabase Edge Functions (Deno), PostgreSQL |
| Blockchain | Wagmi/Viem, ethers.js, Solidity + Foundry |
| Email | Resend |
| Payments | Flutterwave (fiat on-ramp) |

### Project Structure
```
peydot-magic-links/
├── src/                    # React frontend
├── supabase/functions/     # Edge Functions (19 functions)
│   ├── _shared/           # Shared utilities (cors.ts, rateLimit.ts)
│   └── */index.ts         # Individual endpoints
├── contracts/             # Solidity smart contracts (Foundry)
├── whatsapp/              # WhatsApp bot microservice
├── peys-api/             # Express API server
└── sdks/                  # Client SDKs (JS, Python, Go)
```

---

## Security Audit Status

### ✅ COMPLETED FIXES (6 merged)

| PR | Issue | Description |
|----|-------|-------------|
| #310 | SEC-001 | CORS Wildcard → Environment-based ALLOWED_ORIGINS |
| #311 | SEC-002 | Replace Base64 PIN encoding with PBKDF2 hashing |
| #312 | SEC-003 | Add authentication to get-payment endpoint |
| #313 | SEC-004 | Add authorization to payment claim/refund (public-api) |
| #314 | SEC-007 | HMAC timing-safe comparison for webhook signatures |
| #315 | SEC-008 | Add rate limiting to critical endpoints |
| #316 | SEC-009 | Sanitize error messages to prevent info disclosure |

### ❌ REMAINING ISSUES (44 open)

#### CRITICAL (7 issues)
| # | Issue | Location | Fix |
|---|-------|----------|-----|
| SEC-010 | Missing Input Validation on API Endpoints | public-api, create-payment, p2p-marketplace | Add Zod schema validation |
| SEC-017 | Withdrawal Ownership Not Verified | flutterwave-transfer/index.ts | Add user ownership verification |
| SEC-018 | create-payment Missing Authentication | create-payment/index.ts | Add JWT auth check |
| SEC-019 | Wallet Balance Endpoints Unauthenticated | get-token-balance, get-token-allowance | Add JWT auth |
| SEC-025 | P2P Orders Uses Service Role Key | p2p-marketplace/index.ts | Use anon key + RLS |
| SEC-049 | Missing Organization Access Controls | OrganizationsPage, merchant tools | Add RBAC at API level |
| SEC-050 | Memory-Based Timing Attacks | Various auth functions | Use timing-safe comparisons |

#### HIGH (10 issues)
| # | Issue | Location | Fix |
|---|-------|----------|-----|
| SEC-006 | Sensitive Data in localStorage | Multiple files | Move to httpOnly cookies |
| SEC-011 | Unvalidated URL Parameters | PublicPaymentPage, RegisterPage | Sanitize all URL params |
| SEC-012 | CSP Header Disabled | peys-api/src/index.ts | Enable CSP |
| SEC-013 | Service Role Key Inconsistent | webhook-register, p2p-marketplace | Use anon key + RLS |
| SEC-014 | WhatsApp Number Not Validated | RegisterPage, WhatsAppRegisterPage | Add phone format validation |
| SEC-016 | Delete Webhook No Ownership Check | public-api handleDeleteWebhook | Add api_key ownership verify |
| SEC-027 | Renounce Ownership Can Lock Funds | PeysEscrow.sol | Add safety checks |
| SEC-029 | Email Injection Possible | send-email/index.ts | Validate email params |
| SEC-030 | Pagination No Max Limit | Multiple files | Set max 100 items |
| SEC-031 | Smart Card Token Storage | Multiple components | Use httpOnly cookies |

#### MEDIUM (22 issues)
| # | Issue | Fix |
|---|-------|-----|
| SEC-020 | SSRF via Webhook URL | Validate URLs, block private IPs |
| SEC-021 | Form Fields Only Check Presence | Add comprehensive validation |
| SEC-022 | Unvalidated Status Parameter | Validate against enum values |
| SEC-023 | Unvalidated Integer Parsing | Add NaN/bounds checking |
| SEC-024 | dangerouslySetInnerHTML | Sanitize or avoid |
| SEC-026 | Emergency Withdrawal Single Point | Add multi-sig/timelock |
| SEC-028 | No CSRF Protection | Add CSRF tokens or SameSite cookies |
| SEC-032 | No Session Expiration | Implement session timeout |
| SEC-033 | Biometric Auth State in localStorage | Store auth state server-side |
| SEC-034 | No Account Lockout Mechanism | Server-side lockout |
| SEC-035 | Claim Link Enumeration Possible | Use cryptographically random IDs |
| SEC-036 | Sensitive Data in URL Query Strings | Use POST or fragment identifiers |
| SEC-037 | Missing Subresource Integrity | Add SRI hashes for CDN |
| SEC-038 | No Input Length Limits | Add maxLength to forms |
| SEC-039 | P2P Trade Without Amount Validation | Validate against minAmount/maxAmount |
| SEC-040 | No Duplicate Trade Prevention | Add idempotency keys |
| SEC-041 | No Concurrent Trade Prevention | Use DB transactions with locking |
| SEC-042 | Webhook Payload Not Validated | Validate schema before processing |
| SEC-043 | Debug Mode Exposes Information | Remove/conditional console logs |
| SEC-044 | Missing Audit Logging | Add audit trail for sensitive ops |
| SEC-045 | No Idempotency Keys | Add idempotency to payment ops |
| SEC-046 | Insufficient Encryption at Rest | Enable Supabase encryption + column-level |

#### LOW (5 issues)
| # | Issue | Fix |
|---|-------|-----|
| SEC-047 | Missing Payment Amount Overflow Check | Add bounds checking |
| SEC-048 | No Signature Replay Protection | Add timestamp + nonce tracking |

---

## How to Continue the Audit

### Step 1: Switch to Security Branch
```bash
git checkout security-audit
git pull origin main
git checkout -b fix/SEC-010
```

### Step 2: View Issue Details
```bash
gh issue view 269  # SEC-010
```

### Step 3: Make the Fix
Follow the remediation in the issue description.

### Step 4: Commit and Create PR
```bash
git add <files>
git commit -m "fix(SEC-010): Add Zod schema validation to API endpoints"
git push origin fix/SEC-010
gh pr create --title "fix(SEC-010): Add input validation" --body "..." --base main
```

### Step 5: Merge PR
```bash
gh pr merge --squash --delete-branch <pr-url>
```

### Step 6: Reset and Continue
```bash
git checkout security-audit
git pull origin main
git checkout -b fix/SEC-011
```

---

## Key Files Reference

### Edge Functions (in `supabase/functions/`)
| Function | Purpose | Auth | Rate Limit |
|----------|---------|------|------------|
| create-payment | Create escrow payment | JWT ✅ | 30/min |
| claim-payment | Claim via link | JWT ✅ | 30/min |
| get-payment | Get payment details | JWT ✅ | - |
| get-user-payments | List user payments | JWT ✅ | - |
| public-api | Developer REST API | API Key | - |
| flutterwave-webhook | Fiat payment webhook | HMAC | - |
| webhook-dispatcher | Event broadcasting | Service Role | 100/min |
| send-email | Email notifications | - | - |
| send-payment-notification | Payment emails | Service Role | - |
| get-token-balance | Blockchain balance | - ❌ | - |
| get-token-allowance | Token allowance | - ❌ | - |
| p2p-marketplace | P2P trading | Service Role ❌ | - |

### Shared Utilities (in `supabase/functions/_shared/`)
- `cors.ts` - CORS header configuration
- `rateLimit.ts` - IP-based rate limiting

### Frontend (in `src/`)
| Component | Security Issue |
|-----------|---------------|
| BiometricAuthModal.tsx | localStorage for PIN (SEC-002 ✅), auth state (SEC-033) |
| SendPaymentForm.tsx | Input validation (SEC-010) |
| ClaimPage.tsx | URL param sanitization (SEC-011) |
| OrganizationsPage.tsx | localStorage data (SEC-006) |
| TransactionBundlerPage.tsx | localStorage data (SEC-006) |

---

## Environment Variables Needed

### Frontend (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxx
VITE_PRIVY_APP_ID=xxx
VITE_RPC_URL_BASE_SEPOLIA=https://sepolia.base.org
VITE_RPC_URL_CELO=https://alfajores-forno.celo-testnet.org
VITE_RPC_URL_POLKADOT=https://eth-asset-hub-paseo.dotters.network
```

### Supabase Secrets
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
RESEND_API_KEY=re_xxx
FLUTTERWAVE_SECRET_KEY=xxx
FLUTTERWAVE_WEBHOOK_SECRET=xxx
OPENAI_API_KEY=sk-xxx
WEBHOOK_SECRET=xxx
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## Testing Checklist

After each fix, verify:
1. ✅ Code compiles/lints without errors
2. ✅ New authentication works correctly
3. ✅ Authorization checks prevent unauthorized access
4. ✅ Rate limiting kicks in at threshold
5. ✅ Error messages don't leak internals
6. ✅ No regression in existing functionality

---

## Notes for Next Session

1. **Branch Naming**: Use `fix/SEC-0XX` pattern
2. **PR Titles**: Use `fix(SEC-0XX): <description>`
3. **Merge Strategy**: Squash and merge, delete branch
4. **Remote**: Push to `origin` (Moses-main/peydot-magic-links)
5. **Progress**: Update this file after each merged PR

---

## Quick Reference: Remaining Issues by Priority

### Start with CRITICAL issues:
1. SEC-010 (SEC-018 already partially covered by create-payment auth)
2. SEC-017 - Withdrawal ownership
3. SEC-019 - Token balance auth
4. SEC-025 - Service role in P2P
5. SEC-049 - Org access controls
6. SEC-050 - Timing attacks

Then HIGH, then MEDIUM/LOW.

---

*Last Updated: 2026-03-29*
*Completed: 6/50 fixes (12%)*
*Remaining: 44 issues*

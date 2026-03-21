# Peys WhatsApp Bot v2.0

WhatsApp bot for Peys stablecoin payments using **whatsapp-web.js**.

## Features

- Send USDC/USDT via WhatsApp magic links
- Full database integration with Supabase
- Blockchain integration with Base Sepolia, Polkadot, Celo
- Transaction history and balance checking
- Claim code system for recipients

## Database Tables

Uses the same Supabase database as the main app:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with WhatsApp ID, phone, wallet |
| `wallets` | Wallet addresses |
| `transactions` | Full transaction audit trail |
| `escrow_payments` | Escrow contract payments |
| `whatsapp_sessions` | WhatsApp session data |
| `whatsapp_commands` | Command audit log |
| `notifications` | User notifications |

## Quick Start

```bash
cd bot
npm install
cp .env.example .env
# Edit .env with your Supabase and blockchain config
npm start
```

## Usage

1. Start the bot: `npm start`
2. Open http://localhost:3002/qr
3. Scan QR code with WhatsApp
4. Send commands to the bot

### Commands

| Command | Description |
|---------|-------------|
| `menu` | Show available commands |
| `register [PIN]` | Create wallet (4-6 digit PIN) |
| `balance` | Check USDC balance |
| `send [amount] [TOKEN] to [email]` | Send payment |
| `history` | View transaction history |
| `claim` | Check pending payments |
| `confirm` | Confirm pending transaction |
| `cancel` | Cancel pending transaction |

### Example Flow

```
You: register 1234
Bot: ✅ Registration Successful! Wallet: 0x1234...5678

You: balance  
Bot: 💰 USDC: 100.00 Wallet: 0x1234...5678

You: send 50 USDC to alice@email.com
Bot: 📤 Confirm Payment - Reply "confirm" or "cancel"

You: confirm
Bot: ✅ Payment Created! Claim Code: ABC12345
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with service status |
| `/qr` | GET | QR code page |
| `/api/send` | POST | Send message programmatically |
| `/webhook/payment` | POST | Receive payment notifications |

## Project Structure

```
bot/
├── server/
│   ├── index.mjs                    # Main entry point
│   ├── services/
│   │   ├── databaseService.js       # Supabase operations
│   │   ├── blockchainService.js     # Blockchain/ethers.js
│   │   └── escrowService.js         # Escrow payment logic
│   └── utils/
│       └── whatsappUI.js            # Message formatters
├── .waweb_auth/                     # WhatsApp session (auto-created)
├── .env                             # Environment variables
└── package.json
```

## Environment Variables

```bash
# Supabase (required for production)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain
RPC_URL=https://base-sepolia.g.alchemy.com/v2/key
ESCROW_CONTRACT_ADDRESS=0xa33dA56258829779BFbD56a6Be3f2712B79f16ca

# URLs
APP_URL=https://peydot.vercel.app
FRONTEND_URL=http://localhost:5173
PORT=3002
```

## Mock Mode

Without Supabase credentials, the bot runs in mock mode with in-memory storage. Perfect for testing.

## Hosting

Must run on a **persistent server** (Railway, Render, VPS). Cannot run on serverless platforms.

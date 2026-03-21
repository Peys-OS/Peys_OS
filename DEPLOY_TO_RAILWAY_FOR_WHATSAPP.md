# Deploy WhatsApp Bot to Railway

## Current Status
- WhatsApp bot is working locally with whatsapp-web.js
- Bot is connected to Supabase and blockchain services
- Frame detachment issues have been fixed with auto-restart logic
- Bot-frontend is deployed at https://bot-frontend-inky.vercel.app

## Deployment Steps

### 1. Login to Railway
```bash
railway login
```
This opens a browser for authentication.

### 2. Initialize Project
```bash
cd whatsapp
railway init
```
- Choose "Create a new project"
- Name: `pey-whatsapp-bot`
- Region: Choose closest to your users

### 3. Set Environment Variables
In Railway dashboard → Variables tab, add:

```
SUPABASE_URL=https://nhxjvhohfgihmrtiytix.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
VITE_RPC_URL_BASE_SEPOLIA=https://base-sepolia.g.alchemy.com/v2/H3-pV1jNnbXq7-6JEW8Gt
VITE_RPC_URL_CELO=https://celo-sepolia.g.alchemy.com/v2/H3-pV1jNnbXq7-6JEW8Gt
ESCROW_CONTRACT_ADDRESS=0x4a5a67a3666A3f26bF597AdC7c10EA89495e046c
VITE_ESCROW_CONTRACT_ADDRESS_CELO=0xc880AF5d5aC3ea27c26C47D132661A710C245ea5
VITE_USDC_ADDRESS_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
VITE_USDC_ADDRESS_CELO=0x01C5C0122039549AD1493B8220cABEdD739BC44E
APP_URL=https://bot-frontend-inky.vercel.app
FRONTEND_URL=https://bot-frontend-inky.vercel.app
RESEND_API_KEY=<your-resend-api-key>
PORT=3002
```

### 4. Deploy
```bash
railway up
```

### 5. Get QR Code
1. Go to Railway dashboard → Logs tab
2. Wait for QR code to appear
3. Scan with WhatsApp: Settings → Linked Devices → Link a Device

### 6. Set Custom Domain (Optional)
In Railway dashboard → Settings → Networking:
1. Click "Generate Domain" for a railway.app URL
2. Or add custom domain like `whatsapp.pey.xyz`

## Health Check
After deployment, check health at:
```
https://<your-railway-url>/health
```

## Troubleshooting
- Check logs in Railway dashboard for errors
- Ensure all environment variables are set correctly
- Bot auto-restarts on frame detachment errors (max 5 attempts)
- If bot doesn't connect, check that port 3002 is exposed

## Files Modified
- `whatsapp/server/index.mjs` - Added robust frame detachment handling
- `whatsapp/Dockerfile` - For containerized deployment
- `whatsapp/railway.json` - Railway configuration
- `whatsapp/.dockerignore` - Excludes unnecessary files

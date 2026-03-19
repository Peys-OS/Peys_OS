# Peys WhatsApp Bot

Standalone Baileys-based WhatsApp bot. Connects to the same Supabase backend as the main app.

## Structure

```
bot/
├── server/
│   ├── index.mjs            # Entry point
│   ├── config/database.js
│   ├── models/              # User, Payment (Sequelize)
│   ├── routes/              # escrow.js, users.js
│   ├── services/            # escrowService.js, userService.js
│   └── utils/
│       ├── whatsappUI.js    # Baileys message helpers
│       └── supabase.js      # Supabase client
├── migrations/
├── .baileys_auth/           # Auto-created on first run (session data)
├── .env                     # Copy from .env.example
└── .env.example
```

## Setup

```bash
cd bot
npm install
cp .env.example .env
# fill in .env values
npm start
```

On first run a QR code prints in the terminal — scan it with WhatsApp. The session saves to `.baileys_auth/` and persists across restarts.

## Hosting

Must run on a **persistent server** (Railway, Render, DigitalOcean, any VPS). Cannot run on serverless platforms like Vercel.

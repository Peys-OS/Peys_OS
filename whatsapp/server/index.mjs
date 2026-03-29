/**
 * Peys WhatsApp Bot v2.0
 * 
 * WhatsApp bot for Peys stablecoin payments
 * Uses whatsapp-web.js with Supabase database and blockchain integration
 * 
 * Database Tables (same as main app):
 * - profiles (with whatsapp_id, phone_number, passcode_hash)
 * - wallets
 * - transactions
 * - escrow_payments
 * - whatsapp_sessions
 * - whatsapp_commands
 * - notifications
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

// Import services
import escrowService from './services/escrowService.js';
import blockchainService from './services/blockchainService.js';
import dbService from './services/databaseService.js';
import notificationService from './services/notificationService.js';
import conversationStateMachine from './services/conversationStateMachine.js';
const db = dbService;

// ============================================================================
// Configuration
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ============================================================================
// State Management
// ============================================================================

let client = null;
let currentQr = null;
let isConnected = false;
let connectedNumber = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let healthCheckInterval = null;
let lastSuccessfulOperation = Date.now();
let lastQrTime = 0;
const QR_COOLDOWN_MS = 30000; // Only refresh QR every 30 seconds

// User session state for multi-step interactions
const userSessions = new Map();

// ============================================================================
// Initialize Services
// ============================================================================

async function initializeServices() {
  console.log('⏳ Initializing services...');
  
  // Initialize escrow service (connects to blockchain)
  await escrowService.initialize();
  
  // Check database health
  const dbHealth = await db.checkDatabaseHealth();
  console.log('📊 Database: ' + dbHealth.status + ' - ' + dbHealth.message);
  
  console.log('✅ Services initialized\n');
}

// ============================================================================
// WhatsApp Client Initialization
// ============================================================================

async function initializeWhatsApp() {
  const authPath = path.join(process.cwd(), '.waweb_auth');
  const sessionId = 'peys-bot-' + Date.now();
  
  if (!existsSync(authPath)) {
    mkdirSync(authPath, { recursive: true });
  }

  console.log('⏳ Initializing WhatsApp client...');
  
  client = new Client({
    authStrategy: new LocalAuth({ 
      dataPath: authPath,
      clientId: sessionId
    }),
    puppeteer: {
      headless: true,
      protocolTimeout: 120000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    }
  });

  // Set client for notification service
  notificationService.setClient(client);

  // QR Code event
  client.on('qr', (qr) => {
    const now = Date.now();
    if (now - lastQrTime < QR_COOLDOWN_MS) {
      console.log('[QR] Skipping QR refresh (cooldown active)');
      return;
    }
    lastQrTime = now;
    currentQr = qr;
    isConnected = false;
    console.log('\n' + '═'.repeat(60));
    console.log('  📱 SCAN QR CODE WITH WHATSAPP');
    console.log('═'.repeat(60));
    console.log('  Settings → Linked Devices → Link a Device');
    console.log('═'.repeat(60) + '\n');
    // Display QR in terminal
    qrcodeTerminal.generate(qr, { small: true });
    console.log('\n  Web QR: http://localhost:' + PORT + '/qr');
    console.log('═'.repeat(60) + '\n');
  });

  // Authenticated event
  client.on('authenticated', () => {
    console.log('[WhatsApp] Session authenticated');
  });

  // Auth failure event
  client.on('auth_failure', (msg) => {
    console.log('\n' + '═'.repeat(60));
    console.log('  ❌ AUTHENTICATION FAILED');
    console.log('═'.repeat(60));
    console.log('  ' + msg);
    console.log('═'.repeat(60) + '\n');
    isConnected = false;
  });

  // Ready event
  client.on('ready', async () => {
    isConnected = true;
    currentQr = null;
    reconnectAttempts = 0; // Reset reconnect attempts
    lastSuccessfulOperation = Date.now();
    const info = client.info;
    connectedNumber = info?.wid?.user || 'Unknown';
    
    console.log('\n' + '═'.repeat(60));
    console.log('  ✅ USER AUTHENTICATED SUCCESSFULLY');
    console.log('═'.repeat(60));
    console.log('  📱 WhatsApp Number: +' + connectedNumber);
    console.log('  💻 Platform: ' + (info?.platform || 'Unknown'));
    console.log('  🤖 Bot is ready to receive messages');
    console.log('═'.repeat(60) + '\n');

    // Start health check after successful connection
    startHealthCheck();
    
    // Save session to database
    await db.saveWhatsappSession(null, connectedNumber, info?.wid?.user, null);
  });

  // Disconnected event
  client.on('disconnected', (reason) => {
    const wasConnected = isConnected;
    isConnected = false;
    connectedNumber = null;
    currentQr = null;
    
    console.log('\n' + '═'.repeat(60));
    console.log('  ⚠️ WHATSAPP DISCONNECTED');
    console.log('═'.repeat(60));
    console.log('  Reason: ' + reason);
    console.log('═'.repeat(60) + '\n');
    
    // Use the robust restart function
    if (reason !== 'NAVIGATION') {
      console.log('🔄 Scheduling reconnection...');
      restartClient();
    }
  });

  // Message event
  client.on('message', async (message) => {
    try {
      console.log('\n' + '─'.repeat(50));
      console.log('📩 INCOMING MESSAGE');
      console.log('─'.repeat(50));
      console.log('  From: +' + message.from.replace('@c.us', '').replace('@lid', ''));
      console.log('  Time: ' + new Date().toLocaleTimeString());
      console.log('  Message: ' + (message.body?.substring(0, 60) || '[media]'));
      console.log('─'.repeat(50));
      
      await handleMessage(message);
      lastSuccessfulOperation = Date.now();
    } catch (error) {
      if (error.message.includes('Execution context') || 
          error.message.includes('navigation') ||
          error.message.includes('detached')) {
        console.log('⚠️ Navigation error during message handling (ignoring)');
        scheduleHealthCheckRestart();
        return;
      }
      console.error('❌ Message handler error:', error.message);
    }
  });

  // Acknowledged event
  client.on('message_ack', (message, ack) => {
    console.log(`[Message] Ack: ${ack} for ${message.id._serialized}`);
  });

  // Initialize with error handling
  try {
    await client.initialize();
  } catch (error) {
    if (error.message.includes('Execution context was destroyed') || 
        error.message.includes('navigation') ||
        error.message.includes('detached')) {
      console.log('\n⚠️ Browser navigation during auth - this is normal');
      console.log('🔄 Restarting client...\n');
      // Clean up and restart using the robust restart function
      await restartClient();
    } else {
      console.error('❌ Initialization failed:', error.message);
      console.log('🔄 Retrying in 10 seconds...');
      setTimeout(initializeWhatsApp, 10000);
    }
  }
}

// Global error handler for puppeteer issues
process.on('uncaughtException', (error) => {
  if (error.message.includes('Execution context was destroyed') ||
      error.message.includes('navigation') ||
      error.message.includes('detached')) {
    console.log('⚠️ Puppeteer navigation error (non-fatal) - continuing...');
    // Schedule a health check restart if this happens frequently
    scheduleHealthCheckRestart();
    return; // Don't crash
  }
  console.error('❌ Uncaught exception:', error);
});

// ============================================================================
// Health Check and Auto-Restart
// ============================================================================

function scheduleHealthCheckRestart() {
  // If we've had multiple frame errors recently, restart the client
  const now = Date.now();
  const timeSinceLastSuccess = now - lastSuccessfulOperation;
  
  if (timeSinceLastSuccess > 30000) { // 30 seconds without success
    console.log('🔄 Multiple frame errors detected, scheduling client restart...');
    restartClient();
  }
}

async function restartClient() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log('❌ Max reconnect attempts reached. Please check the bot manually.');
    return;
  }
  
  reconnectAttempts++;
  console.log(`🔄 Restarting WhatsApp client (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
  
  try {
    if (client) {
      await client.destroy();
    }
  } catch (e) {
    console.log('⚠️ Error destroying client:', e.message);
  }
  
  // Clear state but preserve session check
  client = null;
  isConnected = false;
  connectedNumber = null;
  
  // Only clear QR if it's been long enough - this prevents spam
  const now = Date.now();
  if (now - lastQrTime > QR_COOLDOWN_MS) {
    currentQr = null;
  }
  
  // Wait and restart
  const delay = Math.min(5000 * reconnectAttempts, 30000); // Exponential backoff, max 30s
  console.log(`⏳ Waiting ${delay/1000}s before restart...`);
  
  setTimeout(async () => {
    try {
      await initializeWhatsApp();
      reconnectAttempts = 0; // Reset on successful initialization
    } catch (error) {
      console.error('❌ Restart failed:', error.message);
      // Try again with longer delay
      setTimeout(() => restartClient(), delay * 2);
    }
  }, delay);
}

// Periodic health check
function startHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    if (!isConnected || !client) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastSuccess = now - lastSuccessfulOperation;
    
    // If no successful operation in 60 seconds, restart
    if (timeSinceLastSuccess > 60000) {
      console.log('⚠️ No successful operations in 60 seconds, restarting client...');
      restartClient();
    }
  }, 30000); // Check every 30 seconds
}

// ============================================================================
// NDPR/NDPA 2023 Consent Handling
// ============================================================================

const CONSENT_PENDING = new Set(); // Track users who haven't given consent yet

async function handleConsent(chatId, phone, text, profile) {
  const lowerText = text.toLowerCase().trim();
  
  // Check if user has already given consent
  if (profile?.consent_given) {
    return { hasConsent: true, action: 'proceed' };
  }
  
  // Check if user already in consent flow
  if (CONSENT_PENDING.has(chatId)) {
    if (lowerText === 'yes' || lowerText === 'y') {
      // User consents - record consent
      CONSENT_PENDING.delete(chatId);
      await recordConsent(chatId, phone, true);
      await sendMessage(chatId,
        '✅ *Consent Recorded*\n\n' +
        'Thank you for consenting to our Privacy Policy.\n' +
        'You can now use all Peys features.\n\n' +
        'Send *menu* to see available commands.'
      );
      return { hasConsent: true, action: 'consented' };
    } else if (lowerText === 'no' || lowerText === 'n') {
      CONSENT_PENDING.delete(chatId);
      await sendMessage(chatId,
        '❌ *Consent Declined*\n\n' +
        'You cannot use Peys without agreeing to our Privacy Policy.\n' +
        'Send *yes* if you change your mind.'
      );
      return { hasConsent: false, action: 'declined' };
    } else {
      await sendMessage(chatId,
        '⚠️ Please reply *YES* to agree or *NO* to decline.\n\n' +
        'Your data will only be processed with your consent as required by NDPR/NDPA 2023.'
      );
      return { hasConsent: false, action: 'awaiting_response' };
    }
  }
  
  return { hasConsent: false, action: 'request_consent' };
}

async function recordConsent(chatId, phone, consentGiven) {
  const client = db.getSupabase();
  if (!client) return;
  
  try {
    // Update profile with consent
    await client
      .from('profiles')
      .update({
        consent_given: consentGiven,
        consent_timestamp: consentGiven ? new Date().toISOString() : null,
        consent_source: 'whatsapp',
        updated_at: new Date().toISOString()
      })
      .eq('whatsapp_id', chatId);
    
    // Update whatsapp_sessions if exists
    await client
      .from('whatsapp_sessions')
      .update({
        consent_given: consentGiven,
        consent_timestamp: consentGiven ? new Date().toISOString() : null
      })
      .eq('phone_number', phone);
    
    // Log consent in audit
    await client
      .from('audit_logs')
      .insert({
        action: consentGiven ? 'consent_given' : 'consent_declined',
        resource_type: 'profile',
        resource_id: chatId,
        metadata: {
          source: 'whatsapp',
          consent_given: consentGiven,
          timestamp: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('Error recording consent:', error);
  }
}

async function requestConsent(chatId) {
  const appUrl = process.env.APP_URL || 'https://peydot.io';
  const privacyUrl = `${appUrl}/privacy-policy`;
  
  CONSENT_PENDING.add(chatId);
  
  await sendMessage(chatId,
    '🔒 *Welcome to Peys OS!*\n\n' +
    'By continuing, you agree to our Privacy Policy: ' + privacyUrl + '\n\n' +
    'We process your data in accordance with NDPR/NDPA 2023.\n\n' +
    'Reply *YES* to proceed.\n' +
    'Reply *NO* to decline.'
  );
}

// ============================================================================
// Message Handler
// ============================================================================

async function handleMessage(message) {
  // Skip status broadcasts and messages from self
  if (message.from === 'status@broadcast' || message.fromMe) {
    return;
  }

  const chatId = message.from;
  const text = message.body?.trim() || '';
  const lowerText = text.toLowerCase();
  const phone = chatId.replace('@c.us', '').replace('@lid', '');

  // Ignore group messages
  if (chatId.endsWith('@g.us')) {
    return;
  }

  // Show typing indicator while processing
  showTyping(chatId, 800).catch(() => {});

  // Check conversation state machine first
  const stateResult = conversationStateMachine.handleMessage(chatId, text, {
    onCancel: async () => {
      await sendMessage(chatId, '❌ *Action cancelled*\n\n_Send "menu" for available commands_');
    },
    onConfirm: async (data) => {
      // Legacy support - redirect to old confirm
      await sendMessage(chatId, '⏳ Processing your confirmation...');
    },
    onPin: async (data) => {
      // Legacy support
      await sendMessage(chatId, '⏳ Verifying PIN...');
    },
    onClaimCode: async (data) => {
      await processClaimWithCode(chatId, phone, data.claimCode);
    }
  });

  if (stateResult !== null) {
    if (stateResult.error) {
      await sendMessage(chatId, stateResult.error);
    }
    return;
  }

  // Get user session (legacy)
  let session = userSessions.get(chatId);
  
  // Check registration
  const isRegistered = await db.isUserRegistered(chatId);
  
  // ========================================================================
  // Public Commands (no registration required)
  // ========================================================================

  // Menu/Help
  if (['menu', 'start', 'help', 'hello', 'hi', 'hey'].includes(lowerText)) {
    await sendMainMenu(chatId, isRegistered);
    await db.logCommand(null, phone, 'menu', null, 'success');
    return;
  }

  // Register - Show registration link
  if (lowerText === 'register' || lowerText === 'sign up' || lowerText.startsWith('register')) {
    // Check if already registered
    if (isRegistered) {
      const profile = await db.getProfileByWhatsappId(chatId);
      const walletTrunc = profile?.wallet_address 
        ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
        : 'Not set';
      
      await sendMessage(chatId,
        '✅ *Already Registered*\n\n' +
        `Wallet: \`${walletTrunc}\`\n` +
        `Email: ${profile?.email || 'Not linked'}\n\n` +
        'Send *menu* to see available commands.'
      );
      await db.logCommand(null, phone, 'register_already', null, 'success');
      return;
    }

    // Send welcome message first
    const welcomeMsg = 
      '👋 *Welcome to Peys!*\n\n' +
      'Peys is a stablecoin wallet that works right here in WhatsApp.\n\n' +
      '✨ *What you can do:*\n' +
      '• Send & receive USDC/USDT\n' +
      '• Pay anyone by email or wallet\n' +
      '• Check your balance anytime\n' +
      '• No apps to download\n\n' +
      'Let\'s create your account...';
    
    await sendMessage(chatId, welcomeMsg);
    await new Promise(r => setTimeout(r, 1000));

    // Peys registration URL
    const appUrl = process.env.APP_URL || 'https://bot-frontend-inky.vercel.app';
    const registerUrl = `${appUrl}/register/whatsapp?wa=${phone}`;
    const registerMsg = `🔐 *Create Your Account*

Tap the link below to register:
${registerUrl}

📋 *Steps:*
1. Tap the link above
2. Sign in with phone or email
3. Your wallet is created automatically
4. Come back here and send *menu*

_It takes less than 30 seconds!_`;
    const profile = await db.getProfileByWhatsappId(chatId);
    
    if (profile?.wallet_address) {
      const walletTrunc = `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`;
      await sendMessage(chatId,
        '✅ *You\'re Registered!*\n\n' +
        `Wallet: \`${walletTrunc}\`\n` +
        `Email: ${profile.email || 'Not linked'}\n` +
        `Phone: ${profile.phone || 'Not linked'}\n\n` +
        'Send *menu* to see commands.'
      );
    } else {
      await sendMessage(chatId,
        '⚠️ *Not Registered Yet*\n\n' +
        'Send *register* to create your account.'
      );
    }
    return;
  }

  // ========================================================================
  // Authenticated Commands (registration required)
  // ========================================================================

  if (!isRegistered) {
    await sendMessage(chatId,
      '⚠️ *Not Registered*\n\n' +
      'Please register first:\n' +
      'Send "register" to get started.'
    );
    return;
  }

  // Get user profile for authenticated commands
  const profile = await db.getProfileByWhatsappId(chatId);
  const wallet = profile?.primary_wallet_address || profile?.wallet_address;

  // ========================================================================
  // NDPR/NDPA 2023 Consent Check
  // ========================================================================
  
  if (profile) {
    const consentCheck = await handleConsent(chatId, phone, text, profile);
    
    // If user just gave consent, don't process other commands
    if (consentCheck.action === 'consented' || consentCheck.action === 'declined') {
      return;
    }
    
    // If consent is pending or needed, only allow menu or consent response
    if (consentCheck.action === 'awaiting_response' || consentCheck.action === 'request_consent') {
      if (consentCheck.action === 'request_consent') {
        await requestConsent(chatId);
      }
      return;
    }
  }

  // Balance
  if (['balance', 'bal', 'wallet'].includes(lowerText)) {
    await handleBalance(chatId, phone, wallet);
    return;
  }

  // History
  if (['history', 'transactions', 'tx'].includes(lowerText)) {
    await handleHistory(chatId, phone);
    return;
  }

  // Transaction Details
  if (lowerText.startsWith('details ') || lowerText.startsWith('detail ')) {
    const txIndex = parseInt(text.split(' ')[1]) - 1;
    if (!isNaN(txIndex)) {
      await handleTransactionDetails(chatId, phone, txIndex);
    } else {
      await sendMessage(chatId, '❌ *Invalid command*\n\nUsage: `details 1` (where 1 is the transaction number)');
    }
    return;
  }

  // Send/Pay
  if (lowerText.startsWith('send ') || lowerText.startsWith('pay ')) {
    await handleSend(chatId, phone, text, wallet);
    return;
  }

  // Claim
  if (lowerText === 'claim' || lowerText.startsWith('claim ')) {
    await handleClaim(chatId, phone);
    return;
  }

  // Confirm pending transaction
  if (lowerText === 'confirm' && session?.pendingTransaction) {
    await confirmTransaction(chatId, phone, session);
    return;
  }

  // Cancel pending transaction
  if (lowerText === 'cancel') {
    if (session?.pendingTransaction) {
      userSessions.delete(chatId);
      await sendMessage(chatId, '❌ Transaction cancelled.');
    } else {
      conversationStateMachine.cancel(chatId);
      await sendMessage(chatId, '❌ Action cancelled.\n\n_Send "menu" for available commands_');
    }
    return;
  }

  // Session/State info
  if (lowerText === 'session' || lowerText === 'state' || lowerText === 'status') {
    const stateInfo = conversationStateMachine.getSessionInfo(chatId);
    if (stateInfo) {
      await sendMessage(chatId,
        `📊 *Session Status*\n\n` +
        `State: ${stateInfo.state}\n` +
        `Duration: ${Math.floor(stateInfo.duration / 1000)}s\n` +
        `Data: ${JSON.stringify(stateInfo.data).slice(0, 100)}`
      );
    } else {
      await sendMessage(chatId, '📊 No active session');
    }
    return;
  }

  // FAQ
  if (['faq', 'help', '?'].includes(lowerText)) {
    await sendFAQ(chatId);
    await db.logCommand(null, phone, 'faq', null, 'success');
    return;
  }

  // Profile
  if (lowerText === 'profile' || lowerText === 'me' || lowerText === 'account') {
    await handleProfile(chatId, phone);
    await db.logCommand(null, phone, 'profile', null, 'success');
    return;
  }

  // Support
  if (lowerText === 'support' || lowerText === 'helpme' || lowerText === 'contact') {
    await handleSupport(chatId, phone);
    await db.logCommand(null, phone, 'support', null, 'success');
    return;
  }

  // Status check for transactions
  if (lowerText.startsWith('status ') || lowerText.startsWith('tx ')) {
    const txId = lowerText.split(' ')[1];
    if (txId) {
      await handleStatus(chatId, phone, txId);
      await db.logCommand(null, phone, 'status', { txId }, 'success');
    } else {
      await sendMessage(chatId,
        '❓ *Please provide a transaction ID*\n\n' +
        'Example: `status abc123`'
      );
    }
    return;
  }

  // Unknown command
  await sendMessage(chatId,
    '❓ *Unknown Command*\n\n' +
    'Send "menu" to see available commands.'
  );
}

// ============================================================================
// Command Handlers
// ============================================================================

async function sendMainMenu(chatId, isRegistered) {
  let menu = '🤖 *Peys WhatsApp Bot*\n\n';
  
  if (isRegistered) {
    menu += '✅ Your wallet is ready\n\n';
    menu += '*Payments:*\n';
    menu += '• `send [amt] [TOKEN] to [email]` - Escrow payment\n';
    menu += '• `send [amt] [TOKEN] to 0x...` - Direct transfer\n';
    menu += '• `balance` - Check wallet\n';
    menu += '• `history` - Transactions\n';
    menu += '• `claim` - Pending claims\n\n';
  } else {
    menu += '⚠️ Register to get started\n\n';
    menu += '*Commands:*\n';
    menu += '• `register` - Create your account\n\n';
  }
  
  menu += '*Supported Tokens:* USDC, USDT\n';
  menu += '*Transfer Types:*\n';
  menu += '• Email → Escrow (recipient claims)\n';
  menu += '• Wallet → Direct (instant)\n\n';
  menu += '_Powered by Peys Protocol_';
  
  await sendMessage(chatId, menu);
}

async function handleBalance(chatId, phone, wallet) {
  if (!wallet) {
    await sendMessage(chatId, '❌ No wallet found. Please register again.');
    return;
  }

  // Get profile for network info
  const profile = await db.getProfileByWhatsappId(chatId);
  
  // Get balances for multiple tokens
  const usdcBalance = await escrowService.getUSDCBalance(wallet);
  const usdtBalance = await escrowService.getUSDTBalance(wallet);
  
  // Determine network (default to base_sepolia)
  const network = profile?.network || 'base_sepolia';
  const networkName = network === 'base_sepolia' ? 'Base Sepolia' : 
                     network === 'celo' ? 'Celo' : 
                     network === 'polkadot' ? 'Polkadot' : network;

  const walletTrunc = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  await sendMessage(chatId,
    `💰 *Your Wallet*\n\n` +
    `Wallet: \`${walletTrunc}\`\n` +
    `Network: ${networkName}\n\n` +
    `*Balances:*\n` +
    `• USDC: ${usdcBalance} ($${usdcBalance})\n` +
    `• USDT: ${usdtBalance} ($${usdtBalance})\n\n` +
    `*Total:* $${parseFloat(usdcBalance) + parseFloat(usdtBalance)}\n\n` +
    `_Send "send [amount] [TOKEN] to [recipient]"_`
  );

  await db.logCommand(null, phone, 'balance', { 
    wallet: walletTrunc, 
    usdc: usdcBalance, 
    usdt: usdtBalance,
    network 
  }, 'success');
}

async function handleHistory(chatId, phone) {
  const transactions = await escrowService.getUserPayments(chatId);
  
  if (transactions.length === 0) {
    await sendMessage(chatId,
      '📋 *Transaction History*\n\n' +
      '_No transactions yet_\n\n' +
      'Send your first payment:\n' +
      '`send 10 USDC to friend@email.com`'
    );
  } else {
    let msg = '📋 *Your Transactions*\n\n';
    
    transactions.slice(0, 10).forEach((tx, i) => {
      const status = tx.status === 'pending' ? '⏳' : tx.status === 'claimed' ? '✅' : tx.status === 'refunded' ? '🔄' : '❓';
      const amount = tx.amount || tx.amount_usd;
      const token = tx.token || 'USDC';
      const direction = tx.is_sender ? '→' : '←';
      const otherParty = tx.recipient_email || tx.sender_email || 'Unknown';
      const date = tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Unknown date';
      
      msg += `${i + 1}. ${status} ${amount} ${token} ${direction} ${otherParty}\n`;
      msg += `   📅 ${date} | ID: ${tx.payment_id?.slice(0, 8) || 'N/A'}\n\n`;
    });
    
    msg += '_Reply "details [number]" for full transaction info_';
    await sendMessage(chatId, msg);
  }
  
  await db.logCommand(null, phone, 'history', { count: transactions.length }, 'success');
}

async function handleTransactionDetails(chatId, phone, txIndex) {
  const transactions = await escrowService.getUserPayments(chatId);
  const tx = transactions[txIndex];
  
  if (!tx) {
    await sendMessage(chatId, '❌ *Transaction not found*\n\nPlease check the number and try again.');
    return;
  }
  
  const status = tx.status === 'pending' ? '⏳ Pending' : tx.status === 'claimed' ? '✅ Claimed' : tx.status === 'refunded' ? '🔄 Refunded' : '❓ Unknown';
  const direction = tx.is_sender ? 'Sent' : 'Received';
  const otherParty = tx.is_sender ? tx.recipient_email : tx.sender_email;
  const amount = tx.amount || tx.amount_usd;
  const token = tx.token || 'USDC';
  const createdDate = tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Unknown';
  const expiryDate = tx.expiry ? new Date(tx.expiry).toLocaleString() : 'N/A';
  
  const message = 
`📋 *Transaction Details #${txIndex + 1}*

*Status:* ${status}
*Type:* ${direction}
*Amount:* ${amount} ${token}

*${direction === 'Sent' ? 'To' : 'From'}:* ${otherParty || 'Unknown'}

*Created:* ${createdDate}
*Expires:* ${expiryDate}

*Payment ID:* \`${tx.payment_id || 'N/A'}\`
*Claim Code:* \`${tx.claim_code || 'N/A'}\`

${tx.tx_hash ? `*Tx Hash:* \`${tx.tx_hash.slice(0, 10)}...${tx.tx_hash.slice(-4)}\`` : ''}`;

  await sendMessage(chatId, message);
  await db.logCommand(null, phone, 'details', { txIndex }, 'success');
}

async function handleSend(chatId, phone, text, wallet) {
  const parts = text.split(' ');
  const amount = parts[1];
  const token = parts[2]?.toUpperCase();
  const toIndex = parts.findIndex(p => p.toLowerCase() === 'to');

  // Validate amount
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    await sendMessage(chatId,
      '❌ *Invalid Amount*\n\n' +
      'Examples:\n' +
      '• `send 50 USDC to alice@email.com`\n' +
      '• `send 50 USDC to 0x1234...abcd`\n' +
      '• `send 50 USDC to @timothy`\n' +
      '• `send 50 USDC to +2348123456789`'
    );
    return;
  }

  // Extract recipient
  let recipient = '';
  if (toIndex !== -1 && toIndex < parts.length - 1) {
    recipient = parts.slice(toIndex + 1).join(' ').trim();
  }

  if (!recipient) {
    await sendMessage(chatId,
      '❌ *Missing Recipient*\n\n' +
      'Example: `send 50 USDC to alice@email.com`\n' +
      'Or: `send 50 USDC to 0x1234...abcd`'
    );
    return;
  }

  // Validate token
  const validTokens = ['USDC', 'USDT'];
  if (!token || !validTokens.includes(token)) {
    await sendMessage(chatId,
      '❌ *Invalid Token*\n\n' +
      'Supported: USDC, USDT'
    );
    return;
  }

  // Resolve recipient (handle @mentions and phone numbers)
  let resolvedRecipient = recipient;
  let recipientWallet = null;
  let recipientName = null;
  let transferType = 'escrow';

  // Check if @mention (username lookup)
  if (recipient.startsWith('@')) {
    const username = recipient.slice(1); // Remove @
    await sendMessage(chatId, '🔍 Looking up @' + username + '...');
    
    const lookupUser = await db.lookupUserByUsername(username);
    if (lookupUser) {
      recipientWallet = lookupUser.primary_wallet_address || lookupUser.wallet_address;
      recipientName = lookupUser.username || username;
      
      if (recipientWallet) {
        resolvedRecipient = recipientWallet;
        transferType = 'direct';
      } else {
        await sendMessage(chatId,
          '❌ *User Found But No Wallet*\n\n' +
          `@${username} is registered but has no wallet yet.\n` +
          'Ask them to complete registration first.'
        );
        return;
      }
    } else {
      await sendMessage(chatId,
        '❌ *User Not Found*\n\n' +
        `No Peys user found with username @${username}.\n\n` +
        'Try their:\n' +
        '• Email: `send 50 USDC to user@email.com`\n' +
        '• Phone: `send 50 USDC to +234...`\n' +
        '• Wallet: `send 50 USDC to 0x...`'
      );
      return;
    }
  }
  // Check if phone number (starts with + or is all digits)
  else if (recipient.startsWith('+') || /^\d{10,15}$/.test(recipient)) {
    await sendMessage(chatId, '🔍 Looking up phone number...');
    
    const lookupUser = await db.lookupUserByPhone(recipient);
    if (lookupUser) {
      recipientWallet = lookupUser.primary_wallet_address || lookupUser.wallet_address;
      recipientName = lookupUser.phone || recipient;
      
      if (recipientWallet) {
        resolvedRecipient = recipientWallet;
        transferType = 'direct';
      } else {
        await sendMessage(chatId,
          '❌ *User Found But No Wallet*\n\n' +
          'This phone number is registered but has no wallet yet.\n' +
          'Ask them to complete registration first.'
        );
        return;
      }
    } else {
      // Phone not registered, treat as email-style recipient
      await sendMessage(chatId,
        '⚠️ *Phone Not Registered*\n\n' +
        'This phone number is not on Peys yet.\n' +
        'The funds will be held in escrow until they register.'
      );
      // Continue with escrow flow
    }
  }
  // Check if wallet address
  else if (/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    resolvedRecipient = recipient;
    transferType = 'direct';
  }
  // Otherwise treat as email (escrow)
  else {
    resolvedRecipient = recipient;
    transferType = 'escrow';
  }

  // Store pending transaction
  userSessions.set(chatId, {
    pendingTransaction: {
      amount: parseFloat(amount),
      token,
      recipient: resolvedRecipient,
      originalRecipient: recipient,
      recipientName,
      wallet,
      transferType,
      timestamp: Date.now()
    }
  });

  // Send confirmation based on transfer type
  const fee = '0.0005';
  const total = parseFloat(amount) + parseFloat(fee);

  if (isWalletAddress) {
    // Direct transfer confirmation
    const recipientTrunc = `${recipient.slice(0, 6)}...${recipient.slice(-4)}`;
    await sendMessage(chatId,
      `📤 *Confirm Direct Transfer*\n\n` +
      `Amount: ${amount} ${token}\n` +
      `To: \`${recipientTrunc}\`\n` +
      `Type: Direct Transfer (instant)\n` +
      `Network Fee: ~${fee} ETH\n\n` +
      `Reply *"confirm"* or *"cancel"*`
    );
  } else {
    // Escrow confirmation
    await sendMessage(chatId,
      `📤 *Confirm Escrow Payment*\n\n` +
      `Amount: ${amount} ${token}\n` +
      `To: ${recipient}\n` +
      `Type: Escrow (recipient must claim)\n` +
      `Network Fee: ~${fee} ETH\n\n` +
      `Reply *"confirm"* or *"cancel"*`
    );
  }
  
  await db.logCommand(null, phone, 'send_prepare', { amount, token, recipient, transferType }, 'success');
}

async function confirmTransaction(chatId, phone, session) {
  const { amount, token, recipient, wallet, transferType } = session.pendingTransaction;
  
  // Clear pending transaction
  userSessions.delete(chatId);

  if (transferType === 'direct') {
    // Direct wallet-to-wallet transfer
    await sendMessage(chatId,
      '⏳ *Processing Direct Transfer...*\n\n' +
      'Sending to blockchain...'
    );

    // For demo, we simulate the transfer
    // In production, this would use blockchainService.directTransfer()
    const result = await blockchainService.directTransfer({
      fromWallet: wallet,
      toAddress: recipient,
      amount: amount.toString(),
      token,
      network: 'base_sepolia'
    });

    if (result.success) {
      const recipientTrunc = `${recipient.slice(0, 6)}...${recipient.slice(-4)}`;
      
      // Create transaction record
      await db.createTransaction({
        type: 'direct_transfer',
        amount: amount.toString(),
        amountUsd: amount,
        token,
        senderWallet: wallet,
        recipientAddress: recipient,
        txHash: result.txHash,
        status: 'confirmed',
        metadata: {
          sender_whatsapp_id: chatId,
          transfer_type: 'direct'
        }
      });

      await sendMessage(chatId,
        `✅ *Direct Transfer Complete!*\n\n` +
        `Amount: ${amount} ${token}\n` +
        `To: \`${recipientTrunc}\`\n` +
        `Tx Hash: \`${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}\`\n\n` +
        `_The funds have been sent directly._`
      );
      
      await db.logCommand(null, phone, 'send_direct', { amount, token, recipient, txHash: result.txHash }, 'success');
    } else {
      await sendMessage(chatId,
        '❌ *Transfer Failed*\n\n' +
        `${result.error || 'Please try again later.'}\n\n` +
        '_Your funds are safe. No transaction was made._'
      );
      
      await db.logCommand(null, phone, 'send_failed', { amount, token, recipient }, 'failed', result.error);
    }
  } else {
    // Escrow payment (existing flow)
    const result = await escrowService.createPayment({
      senderWhatsappId: chatId,
      senderWallet: wallet,
      recipientEmail: recipient,
      amount: amount.toString(),
      token
    });

    if (result.success) {
      // Create transaction record
      await db.createTransaction({
        type: 'escrow_create',
        amount: amount.toString(),
        amountUsd: amount,
        token,
        senderWallet: wallet,
        recipientEmail: recipient,
        escrowId: result.paymentId,
        status: 'confirmed',
        metadata: {
          sender_whatsapp_id: chatId,
          claim_code: result.claimCode
        }
      });

      await sendMessage(chatId,
        `✅ *Escrow Payment Created!*\n\n` +
        `Amount: ${amount} ${token}\n` +
        `To: ${recipient}\n\n` +
        `Claim Code: \`${result.claimCode}\`\n` +
        `Claim Link: ${result.claimLink}\n\n` +
        `_Share the claim code with the recipient_`
      );
      
      await db.logCommand(null, phone, 'send_escrow', { amount, token, recipient, paymentId: result.paymentId }, 'success');
    } else {
      await sendMessage(chatId,
        '❌ *Payment Failed*\n\n' +
        `${result.error || 'Please try again later.'}`
      );
      
      await db.logCommand(null, phone, 'send_failed', { amount, token, recipient }, 'failed', result.error);
    }
  }
}

async function handleClaim(chatId, phone) {
  const claims = await escrowService.getPendingClaims(chatId);
  
  if (claims.length === 0) {
    await sendMessage(chatId,
      '🎁 *Pending Claims*\n\n' +
      '_No pending payments_\n\n' +
      'When someone sends you a payment, you\'ll see it here.'
    );
  } else {
    let msg = '🎁 *Pending Claims*\n\n';
    claims.forEach((claim, i) => {
      msg += `${i + 1}. ${claim.amount} ${claim.token}\n`;
      msg += `   Code: \`${claim.claimCode}\`\n`;
      msg += `   Expires: ${new Date(claim.expiry).toLocaleDateString()}\n\n`;
    });
    msg += '_Reply with claim code to claim_';
    
    // Start state machine for claim code entry
    conversationStateMachine.startClaimCodeEntry(chatId, { claims });
    
    await sendMessage(chatId, msg);
  }
  
  await db.logCommand(null, phone, 'claim', { count: claims.length }, 'success');
}

async function processClaimWithCode(chatId, phone, claimCode) {
  await sendMessage(chatId, `⏳ Claiming payment with code ${claimCode}...`);
  // Process the claim
  await db.logCommand(null, phone, 'claim_code', { claimCode }, 'success');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Show typing indicator
 */
async function showTyping(chatId, duration = 1500) {
  try {
    const chat = await client.getChatById(chatId);
    await chat.sendStateTyping();
    // Wait a bit for realism
    await new Promise(resolve => setTimeout(resolve, duration));
    await chat.clearState();
  } catch (error) {
    // Typing indicator is non-critical, just log
    console.debug('[Typing] Could not show typing indicator:', error.message);
  }
}

/**
 * Send message with typing indicator
 */
async function sendMessage(chatId, text, showTypingIndicator = true) {
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (showTypingIndicator && attempt === 1) {
        await showTyping(chatId);
      }
      await client.sendMessage(chatId, text);
      
      // Log outgoing message
      const phone = chatId.replace('@c.us', '').replace('@lid', '');
      console.log('📤 SENT → +' + phone);
      console.log('   ' + text.substring(0, 60) + (text.length > 60 ? '...' : ''));
      
      lastSuccessfulOperation = Date.now();
      return true;
    } catch (error) {
      lastError = error;
      console.error('❌ Send failed:', error.message);
      
      // Check if it's a frame detachment error
      if (error.message.includes('Execution context') || 
          error.message.includes('navigation') ||
          error.message.includes('detached')) {
        console.log('⚠️ Frame detachment error during send');
        scheduleHealthCheckRestart();
        break; // Don't retry on frame errors
      }
      
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  
  console.error('❌ All send attempts failed');
  return false;
}

/**
 * Send presence available (shows bot is online)
 */
async function sendPresenceAvailable() {
  try {
    await client.sendPresenceAvailable();
  } catch (error) {
    console.debug('[Presence] Error:', error.message);
  }
}

// ============================================================================
// Customer Service Functions
// ============================================================================

/**
 * Send FAQ response
 */
async function sendFAQ(chatId) {
  const faqMsg = 
    '❓ *Frequently Asked Questions*\n\n' +
    '*Getting Started*\n' +
    '• How do I register? Send "register"\n' +
    '• How do I check balance? Send "balance"\n' +
    '• How do I send money? Send "send 10 USDC to email@domain.com"\n\n' +
    '*Payments & Transfers*\n' +
    '• What is the difference between escrow and direct?\n' +
    '  Escrow: For emails (recipient claims)\n' +
    '  Direct: For wallet addresses (instant)\n' +
    '• Are there fees? Network fees only (~$0.01)\n' +
    '• How long do transfers take? Direct: Instant, Escrow: Upon claim\n\n' +
    '*Security*\n' +
    '• Is my wallet secure? Yes, non-custodial\n' +
    '• What if I lose access? Use your Privy login\n' +
    '• Are transactions private? Yes, peer-to-peer\n\n' +
    '*Limits*\n' +
    '• Minimum send: 0.01 USDC\n' +
    '• Maximum send: No limit\n' +
    '• Daily limit: None\n\n' +
    'Still need help? Send "support"';
  
  await sendMessage(chatId, faqMsg);
}

/**
 * Handle profile request
 */
async function handleProfile(chatId, phone) {
  const profile = await db.getProfileByWhatsappId(chatId);
  
  if (!profile) {
    await sendMessage(chatId,
      '❌ *Profile Not Found*\n\n' +
      'You are not registered. Send "register" to create your account.'
    );
    return;
  }
  
  const walletTrunc = profile?.wallet_address 
    ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
    : 'Not set';
    
  const profileMsg = 
    '👤 *Your Profile*\n\n' +
    `📱 WhatsApp: +${profile.whatsapp_id || 'Not linked'}\n` +
    `📧 Email: ${profile.email || 'Not linked'}\n` +
    `📞 Phone: ${profile.phone_number || 'Not linked'}\n` +
    `💳 Wallet: \`${walletTrunc}\`\n` +
    `🆔 User ID: ${profile.id || 'Not set'}\n\n` +
    '_To update your username, contact support._';
    
  await sendMessage(chatId, profileMsg);
}

/**
 * Handle support request
 */
async function handleSupport(chatId, phone) {
  const supportMsg = 
    '📞 *Peys Support*\n\n' +
    'We are here to help! Please describe your issue:\n\n' +
    '1. *Transaction problems*\n' +
    '   - Payment not arriving\n' +
    '   - Claim issues\n' +
    '   - Wrong amount sent\n\n' +
    '2. *Account issues*\n' +
    '   - Cannot access wallet\n' +
    '   - Registration problems\n' +
    '   - Phone/email not linked\n\n' +
    '3. *General questions*\n' +
    '   - How Peys works\n' +
    '   - Fees and limits\n' +
    '   - Future features\n\n' +
    '_Reply with your issue and we will get back to you soon._\n\n' +
    '_Note: For urgent security concerns, contact us immediately._';
    
  await sendMessage(chatId, supportMsg);
}

/**
 * Handle transaction status request
 */
async function handleStatus(chatId, phone, txId) {
  // Validate transaction ID format
  if (!txId || txId.length < 10) {
    await sendMessage(chatId,
      '❌ *Invalid Transaction ID*\n\n' +
      'Please provide a valid transaction ID.\n' +
      'Example: `status abc123def456`'
    );
    return;
  }
  
  // In a real implementation, you would lookup the transaction
  // For now, we'll provide a placeholder response
  await sendMessage(chatId,
    '🔍 *Transaction Status*\n\n' +
    `Transaction ID: \`${txId}\`\n` +
    'Status: Checking...\\n\n' +
    '_This feature is coming soon. For now, please check your wallet balance or contact support if you have concerns about a specific transaction._'
  );
}

// ============================================================================
// API Routes
// ============================================================================

// QR Code page
app.get('/qr', async (req, res) => {
  if (isConnected) {
    res.send(createConnectedPage());
    return;
  }
  
  if (!currentQr) {
    res.send(createLoadingPage());
    return;
  }

  try {
    const qrImage = await qrcode.toDataURL(currentQr, { width: 400, margin: 2 });
    res.send(createQRPage(qrImage));
  } catch (error) {
    res.status(500).send('Error generating QR code');
  }
});

// Health check
app.get('/health', async (req, res) => {
  const escrowHealth = await escrowService.healthCheck();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    whatsapp: {
      connected: isConnected,
      qrAvailable: !!currentQr,
      number: connectedNumber,
      reconnectAttempts,
      maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
      lastSuccessfulOperation: new Date(lastSuccessfulOperation).toISOString(),
      timeSinceLastSuccess: Math.round((Date.now() - lastSuccessfulOperation) / 1000) + 's'
    },
    services: escrowHealth,
    framework: 'whatsapp-web.js'
  });
});

// API endpoint to get QR code data (for auto-refresh)
app.get('/qr/data', async (req, res) => {
  if (isConnected) {
    return res.json({ connected: true, qr: null });
  }
  
  if (!currentQr) {
    // Force regeneration by logging and waiting
    console.log('[QR] No QR available, client may be reconnecting...');
    return res.json({ connected: false, qr: null, message: 'Generating new QR...' });
  }

  try {
    const qrImage = await qrcode.toDataURL(currentQr, { width: 400, margin: 2 });
    res.json({ connected: false, qr: qrImage });
  } catch (error) {
    res.status(500).json({ error: 'Error generating QR' });
  }
});

// Force new QR by triggering reconnect
app.post('/qr/refresh', async (req, res) => {
  if (isConnected) {
    return res.json({ connected: true, message: 'Already connected' });
  }
  
  const now = Date.now();
  if (now - lastQrTime < QR_COOLDOWN_MS) {
    return res.json({ 
      message: 'Please wait ' + Math.ceil((QR_COOLDOWN_MS - (now - lastQrTime))/1000) + 's before requesting new QR' 
    });
  }
  
  console.log('[QR] Forcing new QR generation...');
  lastQrTime = 0; // Reset to allow new QR
  currentQr = null;
  
  // The next qr event will provide a new code
  // We can't directly trigger it, but clearing currentQr helps
  
  res.json({ message: 'QR cleared, new one will be generated shortly' });
});

// API endpoint to send message
app.post('/api/send', async (req, res) => {
  const { to, message } = req.body;
  
  if (!isConnected) {
    return res.status(503).json({ error: 'WhatsApp not connected' });
  }
  
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing: to, message' });
  }

  try {
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    await client.sendMessage(chatId, message);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook for payment notifications
app.post('/webhook/payment', async (req, res) => {
  const { event, payload } = req.body;
  
  console.log(`[Webhook] ${event}:`, payload);
  
  try {
    await notificationService.handlePaymentWebhook(event, payload);
    res.json({ received: true, success: true });
  } catch (error) {
    console.error('[Webhook] Error handling payment:', error.message);
    res.json({ received: true, success: false, error: error.message });
  }
});

// Webhook for registration confirmation from bot-frontend
app.post('/webhook/registration', async (req, res) => {
  const { whatsapp_id, wallet_address, email, phone } = req.body;
  
  console.log(`[Webhook] Registration confirmed for: ${whatsapp_id}`);
  
  if (!whatsapp_id) {
    return res.status(400).json({ error: 'Missing whatsapp_id' });
  }
  
  const chatId = `${whatsapp_id}@c.us`;
  const walletTrunc = wallet_address 
    ? `${wallet_address.slice(0, 6)}...${wallet_address.slice(-4)}`
    : 'Not set';
  
  // Send welcome message to user
  if (isConnected) {
    await sendMessage(chatId,
      '🎉 *Welcome to Peys!*\n\n' +
      'Your account is ready.\n\n' +
      `💳 *Wallet:* \`${walletTrunc}\`\n` +
      `📧 *Email:* ${email || 'Not linked'}\n\n` +
      '*Quick Start:*\n' +
      '• *balance* - Check your wallet\n' +
      '• *send 10 USDC to friend@email.com*\n' +
      '• *history* - View transactions\n' +
      '• *help* - See all commands\n\n' +
      '_Your wallet is secured by Privy._'
    );
  }
  
  res.json({ received: true, notified: isConnected });
});

// ============================================================================
// HTML Pages
// ============================================================================

function createConnectedPage() {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Peys WhatsApp Bot</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #25D366, #128C7E); }
    .container { text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
    h1 { color: #25D366; }
    .status { font-size: 48px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="status">✅</div>
    <h1>WhatsApp Connected!</h1>
    <p>Bot is running and ready.</p>
  </div>
</body>
</html>`;
}

function createLoadingPage() {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Peys WhatsApp Bot</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="3">
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .spinner { width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #25D366; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .container { text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Initializing...</h2>
  </div>
</body>
</html>`;
}

function createQRPage(qrImage) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Peys WhatsApp Bot - QR Code</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      margin: 0; 
      background: linear-gradient(135deg, #25D366, #128C7E);
      padding: 20px;
    }
    .container { 
      text-align: center; 
      background: white; 
      padding: 40px; 
      border-radius: 16px; 
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      max-width: 100%;
    }
    h1 { color: #25D366; margin-bottom: 5px; }
    .subtitle { color: #666; margin-bottom: 20px; }
    .qr-code { 
      margin: 20px 0; 
      padding: 20px; 
      background: #f8f9fa; 
      border-radius: 12px;
      display: inline-block;
    }
    .qr-code img { display: block; max-width: 100%; height: auto; }
    .instructions { color: #666; font-size: 14px; text-align: left; margin: 20px 0; }
    .instructions ol { padding-left: 20px; margin: 10px 0; }
    .instructions li { margin: 8px 0; }
    .timer-container { 
      margin-top: 20px; 
      padding: 15px 20px; 
      background: #e3f2fd; 
      border-radius: 8px; 
      color: #1565c0;
      font-size: 14px;
    }
    .timer { font-weight: bold; font-size: 18px; }
    .progress-bar {
      width: 100%;
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      margin-top: 10px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #25D366;
      border-radius: 3px;
      transition: width 1s linear;
    }
    .btn { 
      margin-top: 15px; 
      padding: 12px 24px; 
      background: #25D366; 
      color: white; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .btn:hover { background: #128C7E; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    .refreshing { opacity: 0.7; }
  </style>
</head>
<body>
  <div class="container" id="container">
    <h1>Peys WhatsApp Bot</h1>
    <p class="subtitle">Scan to connect your WhatsApp</p>
    
    <div class="qr-code" id="qr-code">
      <img src="${qrImage}" alt="WhatsApp QR Code" id="qr-image">
    </div>
    
    <div class="instructions">
      <p><strong>How to scan:</strong></p>
      <ol>
        <li>Open WhatsApp on your phone</li>
        <li>Go to <strong>Settings</strong> → <strong>Linked Devices</strong></li>
        <li>Tap <strong>Link a Device</strong></li>
        <li>Scan the QR code above</li>
      </ol>
    </div>
    
    <div class="timer-container">
      <p>QR expires in: <span class="timer" id="countdown">45</span> seconds</p>
      <div class="progress-bar">
        <div class="progress-fill" id="progress" style="width: 100%"></div>
      </div>
    </div>
    
    <button class="btn" id="refresh-btn" onclick="refreshQR()">Refresh Now</button>
  </div>

  <script>
    // Auto-refresh countdown
    let seconds = 45;
    const totalSeconds = 45;
    const countdownEl = document.getElementById('countdown');
    const progressEl = document.getElementById('progress');
    const container = document.getElementById('container');
    const qrImage = document.getElementById('qr-image');
    const refreshBtn = document.getElementById('refresh-btn');
    
    function updateTimer() {
      seconds--;
      countdownEl.textContent = seconds;
      progressEl.style.width = (seconds / totalSeconds * 100) + '%';
      
      // Change color when low
      if (seconds <= 10) {
        countdownEl.style.color = '#d32f2f';
        progressEl.style.background = '#d32f2f';
      } else if (seconds <= 20) {
        countdownEl.style.color = '#f57c00';
        progressEl.style.background = '#f57c00';
      }
      
      if (seconds <= 0) {
        refreshQR();
      }
    }
    
    async function refreshQR() {
      container.classList.add('refreshing');
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
      
      try {
        // Add timestamp to prevent caching
        const response = await fetch('/qr/data?t=' + Date.now());
        const data = await response.json();
        
        if (data.connected) {
          // Bot connected, reload page
          window.location.reload();
          return;
        }
        
        if (data.qr) {
          // Create new image element to force reload
          const newImg = new Image();
          newImg.onload = function() {
            qrImage.src = this.src;
          };
          // The QR data is already a data URL, use it directly with timestamp
          newImg.src = data.qr + '?t=' + Date.now();
        }
      } catch (error) {
        console.error('Refresh failed:', error);
      }
      
      // Reset timer
      seconds = totalSeconds;
      countdownEl.style.color = '#1565c0';
      progressEl.style.background = '#25D366';
      progressEl.style.width = '100%';
      countdownEl.textContent = seconds;
      
      container.classList.remove('refreshing');
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Refresh Now';
    }
    
    // Start countdown
    setInterval(updateTimer, 1000);
    
    // Also poll for connection status every 5 seconds
    setInterval(async () => {
      try {
        const response = await fetch('/health');
        const data = await response.json();
        if (data.whatsapp.connected) {
          window.location.reload();
        }
      } catch (e) {}
    }, 5000);
  </script>
</body>
</html>`;
}

// ============================================================================
// Start Server
// ============================================================================

async function startServer() {
  app.listen(PORT, () => {
    const dbMode = db.isSupabaseConfigured() ? '✅ Supabase' : '⚠️ Mock (no DB)';
    console.log('\n' + '═'.repeat(60));
    console.log('  🤖 PEYS WHATSAPP BOT v2.0');
    console.log('═'.repeat(60));
    console.log('  Server:  http://localhost:' + PORT);
    console.log('  Health:  http://localhost:' + PORT + '/health');
    console.log('  QR Code: http://localhost:' + PORT + '/qr');
    console.log('  Database: ' + dbMode);
    console.log('═'.repeat(60) + '\n');
  });

  // Initialize services
  await initializeServices();
  
  // Initialize WhatsApp
  await initializeWhatsApp();
}

startServer().catch(console.error);

export default app;

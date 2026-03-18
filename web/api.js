/**
 * PEYS WhatsApp Web - Supabase API Integration
 * Uses Supabase for backend operations
 */

const SUPABASE_URL = 'https://nhxjvhohfgihmrtiytix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oeGp2aG9mZ2lobXJ0aXl0aXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTc2MjQwNCwiZXhwIjoxOTU3MzM4NDA0fQ.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

class PeysApi {
  constructor() {
    this.baseUrl = SUPABASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Profile Operations
  async getProfileByPhone(phone) {
    return this.request(`/rest/v1/profiles?phone_number=eq.${encodeURIComponent(phone)}&select=*`, {
      method: 'GET',
    });
  }

  async createProfile(data) {
    return this.request('/rest/v1/profiles', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: data.phone,
        name: data.name,
        created_at: new Date().toISOString(),
      }),
    });
  }

  async updateProfile(phone, data) {
    return this.request(`/rest/v1/profiles?phone_number=eq.${encodeURIComponent(phone)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Wallet Operations
  async getWalletByProfile(profileId) {
    return this.request(`/rest/v1/wallets?profile_id=eq.${profileId}&is_primary=eq.true&select=*`, {
      method: 'GET',
    });
  }

  async getWalletByAddress(address) {
    return this.request(`/rest/v1/wallets?wallet_address=eq.${encodeURIComponent(address)}&select=*`, {
      method: 'GET',
    });
  }

  async createWallet(data) {
    return this.request('/rest/v1/wallets', {
      method: 'POST',
      body: JSON.stringify({
        profile_id: data.profileId,
        wallet_address: data.walletAddress,
        wallet_type: data.walletType || 'privy',
        chain_id: data.chainId || 84532,
        chain_name: data.chainName || 'base-sepolia',
        privy_user_id: data.privyUserId,
        created_at: new Date().toISOString(),
      }),
    });
  }

  // Transaction Operations
  async getTransactions(phone, limit = 20) {
    return this.request(
      `/rest/v1/transactions?or=(recipient_phone.eq.${encodeURIComponent(phone)})&order=created_at.desc&limit=${limit}`,
      { method: 'GET' }
    );
  }

  async getTransactionByHash(txHash) {
    return this.request(`/rest/v1/transactions?tx_hash=eq.${encodeURIComponent(txHash)}&select=*`, {
      method: 'GET',
    });
  }

  async createTransaction(data) {
    return this.request('/rest/v1/transactions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: data.userId,
        profile_id: data.profileId,
        type: data.type,
        amount: data.amount,
        amount_usd: data.amountUsd,
        token: data.token || 'USDC',
        status: data.status || 'pending',
        recipient_phone: data.recipientPhone,
        recipient_wallet: data.recipientWallet,
        sender_wallet: data.senderWallet,
        escrow_id: data.escrowId,
        memo: data.memo,
        created_at: new Date().toISOString(),
      }),
    });
  }

  async updateTransactionStatus(txHash, status) {
    return this.request(`/rest/v1/transactions?tx_hash=eq.${encodeURIComponent(txHash)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
      }),
    });
  }

  // Escrow/Claim Operations
  async getPendingClaims(phone) {
    return this.request(`/rest/v1/escrow_payments?recipient_phone=eq.${encodeURIComponent(phone)}&status=eq.pending&select=*`, {
      method: 'GET',
    });
  }

  async createEscrowPayment(data) {
    const paymentId = Math.random().toString(36).substring(2, 15);
    const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return this.request('/rest/v1/escrow_payments', {
      method: 'POST',
      body: JSON.stringify({
        payment_id: paymentId,
        secret_hash: data.secretHash || claimCode,
        sender_id: data.senderId,
        sender_profile_id: data.senderProfileId,
        sender_wallet: data.senderWallet,
        recipient_phone: data.recipientPhone,
        claim_code: claimCode,
        amount: data.amount,
        amount_usd: data.amountUsd,
        token: data.token || 'USDC',
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        memo: data.memo,
        created_at: new Date().toISOString(),
      }),
    });
  }

  async claimEscrowPayment(claimCode, recipientPhone) {
    const payments = await this.request(
      `/rest/v1/escrow_payments?claim_code=eq.${encodeURIComponent(claimCode)}&status=eq.pending&select=*`,
      { method: 'GET' }
    );

    if (payments.length === 0) {
      throw new Error('Invalid or expired claim code');
    }

    const payment = payments[0];
    
    await this.request(`/rest/v1/escrow_payments?payment_id=eq.${payment.payment_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status: 'claimed', 
        claimed_at: new Date().toISOString() 
      }),
    });

    return payment;
  }

  // WhatsApp Sessions
  async getWhatsAppSession(phone) {
    return this.request(`/rest/v1/whatsapp_sessions?phone_number=eq.${encodeURIComponent(phone)}&select=*`, {
      method: 'GET',
    });
  }

  async createWhatsAppSession(data) {
    return this.request('/rest/v1/whatsapp_sessions', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: data.phone,
        whatsapp_jid: data.whatsappJid,
        session_data: data.sessionData,
        is_active: true,
        created_at: new Date().toISOString(),
      }),
    });
  }

  // WhatsApp Commands Audit
  async logWhatsAppCommand(data) {
    return this.request('/rest/v1/whatsapp_commands', {
      method: 'POST',
      body: JSON.stringify({
        user_id: data.userId,
        phone_number: data.phone,
        command: data.command,
        parameters: data.parameters,
        response: data.response,
        status: data.status || 'success',
        error_message: data.errorMessage,
        executed_at: new Date().toISOString(),
      }),
    });
  }
}

const api = new PeysApi();

// Helper functions for pages
function getPhoneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('phone') || 'demo';
}

async function loadUserData(phone) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?phone_number=eq.${encodeURIComponent(phone)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const profiles = await response.json();
    return profiles.length > 0 ? profiles[0] : null;
  } catch (error) {
    console.error('Error loading user:', error);
    return null;
  }
}

async function loadWalletForProfile(profileId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/wallets?profile_id=eq.${profileId}&is_primary=eq.true&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const wallets = await response.json();
    return wallets.length > 0 ? wallets[0] : null;
  } catch (error) {
    console.error('Error loading wallet:', error);
    return null;
  }
}

async function loadTransactions(phone, limit = 10) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/transactions?or=(recipient_phone.eq.${encodeURIComponent(phone)})&order=created_at.desc&limit=${limit}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
}

async function loadPendingClaims(phone) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/escrow_payments?recipient_phone=eq.${encodeURIComponent(phone)}&status=eq.pending&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error loading claims:', error);
    return [];
  }
}

// Format amount from BigInt to USDC (6 decimals)
function formatUSDC(amount) {
  if (!amount) return '0.00';
  const num = typeof amount === 'string' ? parseInt(amount) : amount;
  return (num / 1000000).toFixed(2);
}

// Format timestamp
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

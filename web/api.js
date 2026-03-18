/**
 * PEYS WhatsApp Web - Supabase API Integration
 * Uses Supabase for backend operations
 */

const SUPABASE_URL = 'https://nhxjvhohfgihmrtiytix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oeGp2aG9mZ2lobXJ0aXl0aXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTc2MjQwNCwiZXhwIjoxOTU3MzM4NDA0fQ.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

class PeysApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = SUPABASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  // User Operations
  async getUser(phone: string) {
    return this.request(`/rest/v1/users?phone=eq.${phone}&select=*`, {
      method: 'GET',
    });
  }

  async createUser(data: { phone: string; name?: string; pin?: string }) {
    return this.request('/rest/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(phone: string, data: Partial<{ name: string; pin: string; wallet_address: string }>) {
    return this.request(`/rest/v1/users?phone=eq.${phone}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Balance Operations
  async getBalance(phone: string) {
    return this.request(`/rest/v1/balances?phone=eq.${phone}&select=*`, {
      method: 'GET',
    });
  }

  async updateBalance(phone: string, amount: string) {
    return this.request(`/rest/v1/balances?phone=eq.${phone}`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    });
  }

  // Transaction Operations
  async getTransactions(phone: string, limit = 20) {
    return this.request(
      `/rest/v1/transactions?or=(sender.eq.${phone},recipient.eq.${phone})&order=created_at.desc&limit=${limit}`,
      { method: 'GET' }
    );
  }

  async createTransaction(data: {
    sender: string;
    recipient: string;
    amount: string;
    type: 'send' | 'receive' | 'claim';
    memo?: string;
  }) {
    return this.request('/rest/v1/transactions', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        status: 'completed',
        created_at: new Date().toISOString(),
      }),
    });
  }

  // Claims Operations
  async getPendingClaims(phone: string) {
    return this.request(`/rest/v1/claims?recipient_phone=eq.${phone}&status=eq.pending&select=*`, {
      method: 'GET',
    });
  }

  async createClaim(data: { sender: string; recipient_phone: string; amount: string; code: string; memo?: string }) {
    return this.request('/rest/v1/claims', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  }

  async claimFunds(code: string, recipientPhone: string) {
    const claims = await this.request<any[]>(
      `/rest/v1/claims?code=eq.${code}&status=eq.pending&select=*`,
      { method: 'GET' }
    );

    if (claims.length === 0) {
      throw new Error('Invalid or expired claim code');
    }

    const claim = claims[0];
    
    await this.request(`/rest/v1/claims?id=eq.${claim.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'claimed', claimed_at: new Date().toISOString() }),
    });

    return claim;
  }

  // Payment Links
  async getPaymentLinks(phone: string) {
    return this.request(`/rest/v1/payment_links?creator=eq.${phone}&select=*`, {
      method: 'GET',
    });
  }

  async createPaymentLink(data: { creator: string; amount: string; memo?: string; slug?: string }) {
    const slug = data.slug || Math.random().toString(36).substring(2, 10);
    return this.request('/rest/v1/payment_links', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        slug,
        status: 'active',
        views: 0,
        created_at: new Date().toISOString(),
      }),
    });
  }

  // Contacts
  async getContacts(phone: string) {
    return this.request(`/rest/v1/contacts?owner=eq.${phone}&select=*`, {
      method: 'GET',
    });
  }

  async addContact(owner: string, contactPhone: string, name: string) {
    return this.request('/rest/v1/contacts', {
      method: 'POST',
      body: JSON.stringify({
        owner,
        contact_phone: contactPhone,
        name,
        created_at: new Date().toISOString(),
      }),
    });
  }

  // Notifications
  async getNotifications(phone: string) {
    return this.request(`/rest/v1/notifications?user=eq.${phone}&order=created_at.desc&limit=50`, {
      method: 'GET',
    });
  }

  async markNotificationRead(id: string) {
    return this.request(`/rest/v1/notifications?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });
  }
}

// Global API instance
const api = new PeysApi();

// Helper functions for pages
function getPhoneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('phone') || 'demo';
}

async function loadUserData(phone: string) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?phone=eq.${phone}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const users = await response.json();
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error loading user:', error);
    return null;
  }
}

async function loadBalance(phone: string) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/balances?phone=eq.${phone}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const balances = await response.json();
    return balances.length > 0 ? balances[0].amount : '0.00';
  } catch (error) {
    console.error('Error loading balance:', error);
    return '0.00';
  }
}

async function loadTransactions(phone: string, limit = 10) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/transactions?or=(sender.eq.${phone},recipient.eq.${phone})&order=created_at.desc&limit=${limit}`,
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

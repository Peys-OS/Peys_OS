import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const API_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : 'http://localhost:54321/functions/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createPayment(data: {
    senderAddress: string;
    senderEmail?: string;
    recipientEmail?: string;
    tokenAddress: string;
    tokenSymbol?: string;
    amount: string;
    secret: string;
    memo?: string;
    expiryDays?: number;
  }) {
    return this.request<{
      paymentId: string;
      transactionHash: string;
      claimLink: string;
      expiry: string;
    }>('/create-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayment(id: string) {
    return this.request<{
      id: string;
      paymentId: string;
      senderAddress: string;
      amount: string;
      tokenSymbol: string;
      memo: string;
      expiry: string;
      status: 'pending' | 'claimed' | 'refunded' | 'expired';
    }>(`/get-payment`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  }

  async claimPayment(id: string, data: {
    secret: string;
    recipientAddress: string;
    recipientWallet?: string;
    transactionHash?: string;
  }) {
    return this.request<{ success: boolean; transactionHash: string }>('/claim-payment', {
      method: 'POST',
      body: JSON.stringify({ id, ...data }),
    });
  }

  async getUserPayments(walletAddress: string) {
    return this.request<any[]>('/get-user-payments', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string, chainId?: number) {
    return this.request<{ balance: string }>('/get-token-balance', {
      method: 'POST',
      body: JSON.stringify({ tokenAddress, walletAddress, chainId }),
    });
  }

  async getAllowance(tokenAddress: string, ownerAddress: string, chainId?: number) {
    return this.request<{ allowance: string }>('/get-token-allowance', {
      method: 'POST',
      body: JSON.stringify({ tokenAddress, ownerAddress, chainId }),
    });
  }

  async syncUser(data: {
    privyId: string;
    email?: string;
    phone?: string;
    name?: string;
    walletAddress?: string;
    walletType?: string;
    chainId?: number;
  }) {
    return this.request<{
      id: string;
      email?: string;
      walletAddress?: string;
    }>('/sync-user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
export default api;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
    }>('/escrow/create', {
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
    }>(`/escrow/${id}`);
  }

  async claimPayment(id: string, data: {
    secret: string;
    recipientAddress: string;
    recipientWallet?: string;
    transactionHash?: string;
  }) {
    return this.request<{ success: boolean; transactionHash: string }>(`/escrow/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserPayments(walletAddress: string) {
    return this.request<any[]>(`/escrow/user/${walletAddress}`);
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string) {
    return this.request<{ balance: string }>(`/escrow/token/${tokenAddress}/balance/${walletAddress}`);
  }

  async getAllowance(tokenAddress: string, ownerAddress: string) {
    return this.request<{ allowance: string }>(`/escrow/token/${tokenAddress}/allowance/${ownerAddress}`);
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
    }>('/users/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUser(id: string) {
    return this.request<{
      id: string;
      email?: string;
      name?: string;
      walletAddress?: string;
    }>(`/users/${id}`);
  }

  async getUserByWallet(walletAddress: string) {
    return this.request<{
      id: string;
      email?: string;
      name?: string;
      walletAddress?: string;
    }>(`/users/wallet/${walletAddress}`);
  }
}

export const api = new ApiClient();
export default api;

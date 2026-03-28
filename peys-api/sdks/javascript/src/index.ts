/**
 * Peys JavaScript SDK
 * 
 * @version 1.0.0
 * @license MIT
 * 
 * @example
 * import { Peys } from '@peys/sdk';
 * 
 * const peys = new Peys({ apiKey: 'pk_live_xxx' });
 * 
 * // Create a payment
 * const payment = await peys.payments.create({
 *   amount: 100,
 *   currency: 'USDC',
 *   recipient: '0x123...'
 * });
 */

export interface PeysConfig {
  apiKey: string;
  baseUrl?: string;
  network?: 'base-sepolia' | 'polygon-amoy' | 'celo-alfajores';
  timeout?: number;
}

export interface PaymentOptions {
  amount: string | number;
  currency?: 'USDC';
  recipient: string;
  description?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentLinkOptions {
  title: string;
  description?: string;
  amount: number;
  currency: string;
  recipientAddress: string;
  expiresAt?: string;
}

export interface Payment {
  id: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  amount: string;
  currency: string;
  recipient: string;
  txHash?: string;
  createdAt: string;
  claimLink?: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: unknown[];
}

const DEFAULT_BASE_URL = 'https://api.peys.app';

export class Peys {
  private apiKey: string;
  private baseUrl: string;
  private network: string;
  private timeout: number;

  constructor(config: PeysConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.network = config.network || 'base-sepolia';
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ApiResponse<T> = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Request failed');
      }

      return data.data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      throw error;
    }
  }

  public payments = {
    create: async (options: PaymentOptions): Promise<Payment> => {
      const payment = await this.request<Payment>('POST', '/api/v1/payments/initiate', {
        amount: options.amount.toString(),
        currency: options.currency || 'USDC',
        recipientAddress: options.recipient,
        network: this.network,
        commitHash: this.generateCommitHash(),
        ...options.metadata,
      });

      return {
        ...payment,
        claimLink: `${this.baseUrl}/claim/${payment.id}`,
      };
    },

    get: async (id: string): Promise<Payment> => {
      return this.request<Payment>('GET', `/api/v1/payments/${id}`);
    },

    confirm: async (id: string, secret: string): Promise<Payment> => {
      return this.request<Payment>('POST', '/api/v1/payments/confirm', {
        paymentId: id,
        revealSecret: secret,
      });
    },

    refund: async (id: string, reason?: string): Promise<Payment> => {
      return this.request<Payment>('POST', '/api/v1/payments/refund', {
        paymentId: id,
        reason,
      });
    },

    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      network?: string;
    }): Promise<{ items: Payment[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.status) query.set('status', params.status);
      if (params?.network) query.set('network', params.network);

      return this.request('GET', `/api/v1/transactions?${query}`);
    },
  };

  public links = {
    create: async (options: PaymentLinkOptions): Promise<{
      id: string;
      shortUrl: string;
      amount: number;
      currency: string;
    }> => {
      return this.request('POST', '/api/v1/payments/links', {
        ...options,
        network: this.network,
      });
    },

    get: async (id: string): Promise<{
      id: string;
      amount: number;
      currency: string;
      shortUrl: string;
    }> => {
      return this.request('GET', `/api/v1/payments/links/${id}`);
    },

    list: async (params?: {
      page?: number;
      limit?: number;
    }): Promise<{ items: unknown[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());

      return this.request('GET', `/api/v1/payments/links?${query}`);
    },
  };

  public fiat = {
    withdraw: async (options: {
      amount: number;
      currency: 'NGN' | 'KES' | 'ZAR' | 'GHS' | 'USD';
      bankCode: string;
      accountNumber: string;
      accountName: string;
      narration?: string;
    }): Promise<{
      id: string;
      status: string;
      estimatedArrival: string;
    }> => {
      return this.request('POST', '/api/v1/fiat/withdraw', options);
    },

    bills: async (options: {
      type: 'airtime' | 'data' | 'tv' | 'electricity' | 'betting';
      provider: string;
      amount: number;
      phone?: string;
      smartCardNumber?: string;
      meterNumber?: string;
      currency?: string;
    }): Promise<{
      id: string;
      status: string;
      reference: string;
    }> => {
      return this.request('POST', '/api/v1/fiat/bills', options);
    },
  };

  public p2p = {
    createListing: async (options: {
      type: 'buy' | 'sell';
      fiatCurrency: string;
      fiatAmount: number;
      cryptoAmount: string;
      cryptoCurrency: 'USDC';
      paymentMethods: string[];
      exchangeRate: string;
      minAmount: string;
      maxAmount: string;
    }): Promise<{ id: string; status: string }> => {
      return this.request('POST', '/api/v1/p2p/listings', options);
    },

    list: async (params?: {
      type?: string;
      currency?: string;
      page?: number;
      limit?: number;
    }): Promise<{ items: unknown[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.type) query.set('type', params.type);
      if (params?.currency) query.set('currency', params.currency);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());

      return this.request('GET', `/api/v1/p2p/listings?${query}`);
    },

    initiateTrade: async (options: {
      listingId: string;
      fiatAmount: number;
    }): Promise<{ id: string; status: string }> => {
      return this.request('POST', '/api/v1/p2p/trades', options);
    },

    confirmPayment: async (tradeId: string): Promise<{ status: string }> => {
      return this.request('POST', `/api/v1/p2p/trades/${tradeId}/confirm`);
    },

    releaseCrypto: async (tradeId: string): Promise<{ status: string }> => {
      return this.request('POST', `/api/v1/p2p/trades/${tradeId}/release`);
    },
  };

  public webhooks = {
    register: async (options: {
      url: string;
      events: string[];
      secret?: string;
    }): Promise<{ id: string; secret: string }> => {
      return this.request('POST', '/api/v1/webhooks', options);
    },
  };

  private generateCommitHash(): string {
    const secret = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    return crypto.subtle.digest('SHA-256', data).then((hash) => {
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }) as unknown as string;
  }
}

export default Peys;
export { Peys as Client };

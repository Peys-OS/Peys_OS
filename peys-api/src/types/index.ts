import { ethers } from 'ethers';

export interface ApiKey {
  id: string;
  merchantId: string;
  key: string;
  name: string;
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  businessType: string;
  apiKeys: ApiKey[];
  webhookUrl: string | null;
  createdAt: string;
  isVerified: boolean;
}

export interface PaymentLink {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  recipientAddress: string;
  network: 'base-sepolia' | 'polygon-amoy' | 'celo-alfajores';
  expiresAt: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface PaymentRequest {
  id: string;
  merchantId: string;
  paymentLinkId: string | null;
  amount: string;
  currency: string;
  recipientAddress: string;
  senderAddress: string;
  txHash: string | null;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  network: string;
  createdAt: string;
  confirmedAt: string | null;
}

export interface P2PListing {
  id: string;
  sellerId: string;
  type: 'buy' | 'sell';
  fiatCurrency: string;
  fiatAmount: number;
  cryptoAmount: string;
  cryptoCurrency: string;
  paymentMethods: string[];
  exchangeRate: string;
  minAmount: string;
  maxAmount: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

export interface P2PTrade {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  fiatAmount: number;
  cryptoAmount: string;
  status: 'initiated' | 'paid' | 'released' | 'disputed' | 'cancelled';
  createdAt: string;
}

export interface VirtualAccount {
  id: string;
  merchantId: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
  explorerUrl: string;
}

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  'base-sepolia': {
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    contractAddress: process.env.CONTRACT_BASE_SEPOLIA || '0x5afbbf7ac3008ce064178b42fe0fc8e87f82f514dd9bb3fc116c5e2ab091c8e0',
    explorerUrl: 'https://sepolia.basescan.org',
  },
  'polygon-amoy': {
    chainId: 80002,
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    contractAddress: process.env.CONTRACT_POLYGON_AMOY || '0xbe3ace4f8ce1ded010123d927a752c7ade17eaba1da07bdc078c5eba494478b7',
    explorerUrl: 'https://www.oklink.com/amoy',
  },
  'celo-alfajores': {
    chainId: 44787,
    rpcUrl: process.env.CELO_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
    contractAddress: process.env.CONTRACT_CELO_ALFAJORES || '0x0b4e459faa79a52a28e9776bc5a0402fc0328544480b4ca4257f7f10973e5562',
    explorerUrl: 'https://alfajores.celoscan.io',
  },
};

export const CURRENCIES = ['USDC', 'USD', 'EUR', 'GBP', 'NGN', 'KES', 'ZAR', 'GHS', 'XOF'];
export const AFRICAN_COUNTRIES = ['NG', 'KE', 'ZA', 'GH', 'TZ', 'UG', 'RW', 'SN', 'CI', 'CM', 'ET', 'MW', 'ZM', 'BW'];

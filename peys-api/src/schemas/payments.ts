import { z } from 'zod';

export const createPaymentLinkSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  currency: z.enum(['USDC', 'USD', 'EUR', 'GBP']),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  network: z.enum(['base-sepolia', 'polygon-amoy', 'celo-alfajores']),
  expiresAt: z.string().datetime().optional(),
});

export const getPaymentLinkSchema = z.object({
  id: z.string().uuid(),
});

export const listPaymentLinksSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const initiatePaymentSchema = z.object({
  paymentLinkId: z.string().uuid().optional(),
  amount: z.string().regex(/^\d+$/),
  currency: z.enum(['USDC']),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  senderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  commitHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  network: z.enum(['base-sepolia', 'polygon-amoy', 'celo-alfajores']),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
});

export const confirmPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  revealSecret: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export const getPaymentStatusSchema = z.object({
  paymentId: z.string().uuid(),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['payment.completed', 'payment.failed', 'payment.refunded'])),
  secret: z.string().min(32).optional(),
});

export const fiatWithdrawalSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['NGN', 'KES', 'ZAR', 'GHS', 'USD', 'EUR', 'GBP']),
  bankCode: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  narration: z.string().max(100).optional(),
});

export const billsPaymentSchema = z.object({
  type: z.enum(['airtime', 'data', 'tv', 'electricity', 'betting']),
  provider: z.string(),
  amount: z.number().positive(),
  phone: z.string().optional(),
  smartCardNumber: z.string().optional(),
  meterNumber: z.string().optional(),
  currency: z.enum(['NGN', 'KES', 'GHS', 'USD']),
});

export const p2PCreateListingSchema = z.object({
  type: z.enum(['buy', 'sell']),
  fiatCurrency: z.enum(['NGN', 'KES', 'ZAR', 'GHS', 'USD', 'EUR', 'GBP']),
  fiatAmount: z.number().positive(),
  cryptoAmount: z.string(),
  cryptoCurrency: z.enum(['USDC']),
  paymentMethods: z.array(z.string()).min(1),
  exchangeRate: z.string(),
  minAmount: z.string(),
  maxAmount: z.string(),
});

export const p2PInitiateTradeSchema = z.object({
  listingId: z.string().uuid(),
  fiatAmount: z.number().positive(),
});

export const p2PConfirmPaymentSchema = z.object({
  tradeId: z.string().uuid(),
});

export const p2PReleaseCryptoSchema = z.object({
  tradeId: z.string().uuid(),
});

export type CreatePaymentLink = z.infer<typeof createPaymentLinkSchema>;
export type InitiatePayment = z.infer<typeof initiatePaymentSchema>;
export type ConfirmPayment = z.infer<typeof confirmPaymentSchema>;
export type FiatWithdrawal = z.infer<typeof fiatWithdrawalSchema>;
export type BillsPayment = z.infer<typeof billsPaymentSchema>;
export type P2PCreateListing = z.infer<typeof p2PCreateListingSchema>;
export type P2PInitiateTrade = z.infer<typeof p2PInitiateTradeSchema>;

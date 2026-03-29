import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash, randomBytes } from 'crypto';
import { ApiKey, Merchant } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    merchant?: Merchant;
    apiKey?: ApiKey;
  }
}

const API_KEY_HEADER = 'x-api-key';
const API_KEY_PREFIX = 'peys_live_' | 'peys_test_';

export async function generateApiKey(
  merchantId: string,
  isTest: boolean = false
): Promise<string> {
  const prefix = isTest ? 'peys_test_' : 'peys_live_';
  const randomPart = randomBytes(24).toString('hex');
  return `${prefix}${randomPart}`;
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return createHash('sha256').update(apiKey).digest('hex');
}

export async function validateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers[API_KEY_HEADER] as string | undefined;

  if (!apiKey) {
    return reply.status(401).send({
      status: 'error',
      message: 'Missing API key. Provide x-api-key header.',
    });
  }

  if (!apiKey.startsWith('peys_live_') && !apiKey.startsWith('peys_test_')) {
    return reply.status(401).send({
      status: 'error',
      message: 'Invalid API key format.',
    });
  }

  const hashedKey = await hashApiKey(apiKey);
  
  const merchant = await getMerchantByApiKey(hashedKey);
  if (!merchant) {
    return reply.status(401).send({
      status: 'error',
      message: 'Invalid API key.',
    });
  }

  request.merchant = merchant.merchant;
  request.apiKey = merchant.apiKey;
}

async function getMerchantByApiKey(hashedKey: string): Promise<{ merchant: Merchant; apiKey: ApiKey } | null> {
  const mockMerchant: Merchant = {
    id: 'merchant_001',
    name: 'Test Merchant',
    email: 'merchant@test.com',
    businessType: 'ecommerce',
    apiKeys: [{
      id: 'key_001',
      merchantId: 'merchant_001',
      key: hashedKey,
      name: 'Production Key',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true,
    }],
    webhookUrl: null,
    createdAt: new Date().toISOString(),
    isVerified: true,
  };

  const mockApiKey: ApiKey = mockMerchant.apiKeys[0];

  return { merchant: mockMerchant, apiKey: mockApiKey };
}

export function requireWebhookSignature(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  const signature = request.headers['x-flutterwave-signature'] as string;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    return done();
  }

  if (!signature) {
    return reply.status(401).send({ status: 'error', message: 'Missing webhook signature' });
  }

  const { createHmac } = await import('crypto');
  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(JSON.stringify(request.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return reply.status(401).send({ status: 'error', message: 'Invalid webhook signature' });
  }

  done();
}

export function rateLimitConfig(windowMs: number, maxRequests: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async function rateLimit(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const key = request.apiKey?.id || request.ip;
    const now = Date.now();
    const record = requests.get(key);

    if (record && now < record.resetTime) {
      record.count++;
      if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        return reply.status(429).header('Retry-After', retryAfter.toString()).send({
          status: 'error',
          message: 'Too many requests. Please try again later.',
          retryAfter,
        });
      }
    } else {
      requests.set(key, { count: 1, resetTime: now + windowMs });
    }

    reply.header('X-RateLimit-Limit', maxRequests.toString());
    reply.header('X-RateLimit-Remaining', 
      Math.max(0, maxRequests - (record?.count || 0)).toString()
    );
    reply.header('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
  };
}

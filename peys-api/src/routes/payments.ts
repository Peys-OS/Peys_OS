import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  createPaymentLinkSchema, 
  initiatePaymentSchema,
  confirmPaymentSchema,
  getPaymentStatusSchema,
  refundPaymentSchema,
  fiatWithdrawalSchema,
  billsPaymentSchema,
  p2PCreateListingSchema,
  p2PInitiateTradeSchema,
  p2PConfirmPaymentSchema,
  p2PReleaseCryptoSchema
} from '../schemas/payments.js';
import { validateApiKey, rateLimitConfig } from '../middleware/auth.js';
import { EscrowService } from '../services/escrow.js';
import { v4 as uuidv4 } from 'uuid';

const escrowService = new EscrowService();
const limited = rateLimitConfig(60000, 100);

export async function paymentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', validateApiKey);
  fastify.addHook('preHandler', limited);

  fastify.post('/links', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createPaymentLinkSchema.parse(request.body);
    
    const paymentLink = {
      id: uuidv4(),
      merchantId: request.merchant!.id,
      title: body.title,
      description: body.description || '',
      amount: body.amount,
      currency: body.currency,
      recipientAddress: body.recipientAddress,
      network: body.network,
      expiresAt: body.expiresAt || null,
      createdAt: new Date().toISOString(),
      isActive: true,
      shortUrl: `https://peys.app/pay/${uuidv4().slice(0, 8)}`,
    };

    return reply.status(201).send({
      status: 'success',
      data: paymentLink,
    });
  });

  fastify.get('/links', async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
    
    return reply.send({
      status: 'success',
      data: {
        items: [],
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  });

  fastify.get('/links/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    return reply.send({
      status: 'success',
      data: {
        id,
        merchantId: request.merchant!.id,
        title: 'Sample Link',
        amount: 100,
        currency: 'USDC',
        shortUrl: `https://peys.app/pay/${id.slice(0, 8)}`,
      },
    });
  });

  fastify.post('/payments/initiate', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = initiatePaymentSchema.parse(request.body);
    
    const commitHash = body.commitHash;
    const paymentId = escrowService.generatePaymentId();
    
    const transaction = {
      id: uuidv4(),
      merchantId: request.merchant!.id,
      paymentId,
      amount: body.amount,
      currency: body.currency,
      recipientAddress: body.recipientAddress,
      senderAddress: body.senderAddress,
      commitHash,
      network: body.network,
      txHash: body.txHash || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return reply.status(201).send({
      status: 'success',
      data: {
        transactionId: transaction.id,
        paymentId,
        commitHash,
        status: 'pending',
      },
    });
  });

  fastify.post('/payments/confirm', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = confirmPaymentSchema.parse(request.body);
    
    const txHash = await escrowService.confirmPayment(body.paymentId, body.revealSecret);
    
    return reply.send({
      status: 'success',
      data: {
        paymentId: body.paymentId,
        txHash,
        status: 'confirmed',
        explorerUrl: escrowService.getExplorerUrl(txHash),
      },
    });
  });

  fastify.get('/payments/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    try {
      const status = await escrowService.getPaymentStatus(id);
      
      return reply.send({
        status: 'success',
        data: {
          paymentId: id,
          recipient: status.recipient,
          amount: status.amount,
          status: ['pending', 'committed', 'revealed', 'completed', 'refunded'][status.status] || 'unknown',
          createdAt: new Date(status.createdAt * 1000).toISOString(),
        },
      });
    } catch {
      return reply.status(404).send({
        status: 'error',
        message: 'Payment not found',
      });
    }
  });

  fastify.post('/payments/refund', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refundPaymentSchema.parse(request.body);
    
    const txHash = await escrowService.refundPayment(body.paymentId, body.reason);
    
    return reply.send({
      status: 'success',
      data: {
        paymentId: body.paymentId,
        txHash,
        status: 'refunded',
        explorerUrl: escrowService.getExplorerUrl(txHash),
      },
    });
  });

  fastify.get('/transactions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 20, status, network } = request.query as {
      page?: number;
      limit?: number;
      status?: string;
      network?: string;
    };

    return reply.send({
      status: 'success',
      data: {
        items: [],
        meta: { page, limit, total: 0 },
      },
    });
  });

  fastify.post('/webhooks', async (request: FastifyRequest, reply: FastifyReply) => {
    const { url, events, secret } = request.body as {
      url: string;
      events: string[];
      secret?: string;
    };

    const webhook = {
      id: uuidv4(),
      merchantId: request.merchant!.id,
      url,
      events,
      secret: secret || uuidv4(),
      createdAt: new Date().toISOString(),
    };

    return reply.status(201).send({
      status: 'success',
      data: webhook,
    });
  });

  fastify.get('/balances', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      status: 'success',
      data: {
        USDC: {
          available: '0.00',
          pending: '0.00',
          total: '0.00',
        },
        balances: [],
      },
    });
  });

  fastify.get('/networks', async (request: FastifyRequest, reply: FastifyReply) => {
    const networkInfo = escrowService.getNetworkInfo();
    
    return reply.send({
      status: 'success',
      data: {
        networks: [
          {
            id: 'base-sepolia',
            name: 'Base Sepolia',
            chainId: 84532,
            isSupported: true,
            contractAddress: networkInfo.contractAddress,
          },
          {
            id: 'polygon-amoy',
            name: 'Polygon Amoy',
            chainId: 80002,
            isSupported: true,
            contractAddress: '',
          },
          {
            id: 'celo-alfajores',
            name: 'Celo Alfajores',
            chainId: 44787,
            isSupported: true,
            contractAddress: '',
          },
        ],
      },
    });
  });
}

export async function fiatRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', validateApiKey);

  fastify.post('/withdraw', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = fiatWithdrawalSchema.parse(request.body);
    
    return reply.send({
      status: 'success',
      data: {
        id: uuidv4(),
        amount: body.amount,
        currency: body.currency,
        bankCode: body.bankCode,
        accountNumber: body.accountNumber,
        status: 'processing',
        estimatedArrival: '1-2 business days',
      },
    });
  });

  fastify.post('/bills', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = billsPaymentSchema.parse(request.body);
    
    return reply.send({
      status: 'success',
      data: {
        id: uuidv4(),
        type: body.type,
        provider: body.provider,
        amount: body.amount,
        status: 'completed',
        reference: `BL-${uuidv4().slice(0, 8).toUpperCase()}`,
      },
    });
  });
}

export async function p2pRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', validateApiKey);

  fastify.post('/listings', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = p2PCreateListingSchema.parse(request.body);
    
    const listing = {
      id: uuidv4(),
      merchantId: request.merchant!.id,
      ...body,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    return reply.status(201).send({
      status: 'success',
      data: listing,
    });
  });

  fastify.get('/listings', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type, currency, page = 1, limit = 20 } = request.query as {
      type?: string;
      currency?: string;
      page?: number;
      limit?: number;
    };

    return reply.send({
      status: 'success',
      data: { items: [], page, limit, total: 0 },
    });
  });

  fastify.post('/trades', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = p2PInitiateTradeSchema.parse(request.body);
    
    const trade = {
      id: uuidv4(),
      listingId: body.listingId,
      merchantId: request.merchant!.id,
      fiatAmount: body.fiatAmount,
      status: 'initiated',
      createdAt: new Date().toISOString(),
    };

    return reply.status(201).send({
      status: 'success',
      data: trade,
    });
  });

  fastify.post('/trades/:id/confirm', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    return reply.send({
      status: 'success',
      data: { tradeId: id, status: 'paid' },
    });
  });

  fastify.post('/trades/:id/release', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    return reply.send({
      status: 'success',
      data: { tradeId: id, status: 'released' },
    });
  });
}

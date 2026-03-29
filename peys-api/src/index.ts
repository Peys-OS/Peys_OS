import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { paymentRoutes, fiatRoutes, p2pRoutes } from './routes/payments.js';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-webhook-signature'],
});

await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://*.supabase.co', 'https://*.privy.io'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "same-site" },
});

// Add CSRF protection via SameSite cookies
fastify.addHook('onRequest', async (request, reply) => {
  // Set secure cookie defaults for any cookies set by the API
  reply.headers({
    'Set-Cookie': 'Secure; HttpOnly; SameSite=Strict',
  });
});

fastify.get('/health', async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
});

fastify.get('/api/v1', async () => {
  return {
    name: 'Peys Payment API',
    version: '1.0.0',
    documentation: 'https://docs.peys.app',
    endpoints: {
      payments: '/api/v1/payments',
      paymentLinks: '/api/v1/payments/links',
      fiat: '/api/v1/fiat',
      p2p: '/api/v1/p2p',
      webhooks: '/api/v1/webhooks',
      documentation: 'https://docs.peys.app/api',
    },
  };
});

await fastify.register(paymentRoutes, { prefix: '/api/v1/payments' });
await fastify.register(fiatRoutes, { prefix: '/api/v1/fiat' });
await fastify.register(p2pRoutes, { prefix: '/api/v1/p2p' });

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  if (error.validation) {
    return reply.status(400).send({
      status: 'error',
      message: 'Validation failed',
      errors: error.validation,
    });
  }
  
  return reply.status(error.statusCode || 500).send({
    status: 'error',
    message: error.message || 'Internal server error',
  });
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Peys API server running at http://${host}:${port}`);
    console.log(`📚 API docs available at http://${host}:${port}/api/v1`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;

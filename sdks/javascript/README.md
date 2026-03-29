# Peys SDK for JavaScript/TypeScript

The official Peys payment SDK for JavaScript and TypeScript applications.

## Features

- **Magic Claim Links**: Send crypto payments via shareable links
- **Multi-chain Support**: Works with Base, Celo, and Polkadot Asset Hub
- **WhatsApp Integration**: Build WhatsApp bot integrations
- **TypeScript Support**: Full TypeScript definitions included
- **REST API Client**: Easy integration with Peys API

## Installation

```bash
npm install @peys/sdk
```

## Authentication

You need a Peys API key from your [dashboard](https://peydot.io/dashboard).

```typescript
import { PeysClient } from '@peys/sdk';

const client = new PeysClient({
  apiKey: 'your-api-key'
});
```

## Quick Start

### Send a Payment

```typescript
const payment = await client.payments.create({
  recipient: 'recipient@example.com',
  amount: 1000000, // in smallest unit (USDC has 6 decimals)
  token: 'USDC'
});

console.log('Payment link:', payment.claimLink);
```

### Check Payment Status

```typescript
const status = await client.payments.get(payment.id);
console.log('Status:', status.status);
```

### Claim a Payment

```typescript
await client.payments.claim(payment.id, {
  walletAddress: '0x...',
  secret: payment.secret
});
```

## Documentation

For full documentation, visit [docs.peys.io](https://docs.peys.io).

## License

MIT

import { http, createConfig, fallback } from 'wagmi';
import { mainnet, polygon, arbitrum, celo, base, baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';

const baseSepoliaRpcs = [
  import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || 'https://base-sepolia.g.alchemy.com/v2/demo',
  'https://sepolia.base.org',
  'https://base-sepolia-rpc.publicnode.com',
];

const celoRpcs = [
  import.meta.env.VITE_RPC_URL_CELO || 'https://alfajores-forno.celo-testnet.org',
  'https://alfajores.celo.org',
];

const polygonAmoyRpcs = [
  import.meta.env.VITE_RPC_URL_POLYGON || 'https://polygon-amoy.g.alchemy.com/v2/demo',
];

// Define Celo Alfajores Testnet
export const celoAlfajores = {
  id: 44787,
  name: 'Celo Alfajores',
  network: 'celo-alfajores',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: celoRpcs,
    },
    public: {
      http: celoRpcs,
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Alfajores Explorer',
      url: 'https://alfajores-blockscout.celo-testnet.org',
    },
  },
  testnet: true,
} as const;

// Define Polygon Amoy Testnet (Chain ID: 80002)
export const polygonAmoy = {
  id: 80002,
  name: 'Polygon Amoy',
  network: 'polygon-amoy',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: polygonAmoyRpcs,
    },
    public: {
      http: polygonAmoyRpcs,
    },
  },
  blockExplorers: {
    default: {
      name: 'Polygon Amoy Explorer',
      url: 'https://amoy.polygonscan.com',
    },
  },
  testnet: true,
} as const;

export const config = createConfig({
  chains: [celoAlfajores, celo, base, baseSepolia, polygonAmoy, mainnet, polygon, arbitrum],
  connectors: [
    injected(),
    coinbaseWallet(),
  ],
  transports: {
    [celoAlfajores.id]: fallback(celoRpcs.map(rpc => http(rpc)), { rank: true }),
    [celo.id]: fallback(celoRpcs.map(rpc => http(rpc)), { rank: true }),
    [base.id]: http(import.meta.env.VITE_RPC_URL_BASE || 'https://mainnet.base.org'),
    [baseSepolia.id]: fallback(baseSepoliaRpcs.map(rpc => http(rpc)), { rank: true }),
    [polygonAmoy.id]: fallback(polygonAmoyRpcs.map(rpc => http(rpc)), { rank: true }),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});

export const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000001';
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7';

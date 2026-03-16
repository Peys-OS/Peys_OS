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

const polkadotRpcs = [
  import.meta.env.VITE_RPC_URL_POLKADOT || 'https://eth-rpc-testnet.polkadot.io',
  'https://eth-asset-hub-paseo.dotters.network',
];

// Define Polkadot Asset Hub (Paseo Testnet) - Chain ID 420420417
export const polkadotAssetHub = {
  id: 420420417,
  name: 'Polkadot Asset Hub Testnet',
  network: 'polkadot-asset-hub-testnet',
  nativeCurrency: {
    name: 'PAS',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: polkadotRpcs,
    },
    public: {
      http: polkadotRpcs,
    },
  },
  blockExplorers: {
    default: {
      name: 'Polkadot Testnet Explorer',
      url: 'https://polkadot.testnet.routescan.io',
    },
  },
  testnet: true,
} as const;

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

export const config = createConfig({
  chains: [polkadotAssetHub, celoAlfajores, celo, base, baseSepolia, mainnet, polygon, arbitrum],
  transports: {
    [polkadotAssetHub.id]: fallback(polkadotRpcs.map(rpc => http(rpc)), { rank: true }),
    [celoAlfajores.id]: fallback(celoRpcs.map(rpc => http(rpc)), { rank: true }),
    [celo.id]: fallback(celoRpcs.map(rpc => http(rpc)), { rank: true }),
    [base.id]: http(import.meta.env.VITE_RPC_URL_BASE || 'https://mainnet.base.org'),
    [baseSepolia.id]: fallback(baseSepoliaRpcs.map(rpc => http(rpc)), { rank: true }),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
  connectors: [
    injected(),
    coinbaseWallet(),
  ],
});

export const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000001';
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7';

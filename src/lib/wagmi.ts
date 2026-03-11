import { http, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, celo, base, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Define Polkadot Asset Hub (EVM compatible)
export const polkadotAssetHub = {
  id: 420420421,
  name: 'Polkadot Asset Hub',
  network: 'polkadot-asset-hub',
  nativeCurrency: {
    name: 'DOT',
    symbol: 'DOT',
    decimals: 10,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_RPC_URL_POLKADOT || 'https://eth-asset-hub-paseo.dotters.network'],
    },
    public: {
      http: [import.meta.env.VITE_RPC_URL_POLKADOT || 'https://eth-asset-hub-paseo.dotters.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Polkadot Asset Hub Explorer',
      url: 'https://polkadot.js.org/apps',
    },
  },
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
      http: [import.meta.env.VITE_RPC_URL_CELO || 'https://alfajores-forno.celo-testnet.org'],
    },
    public: {
      http: [import.meta.env.VITE_RPC_URL_CELO || 'https://alfajores-forno.celo-testnet.org'],
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
    [polkadotAssetHub.id]: http(import.meta.env.VITE_RPC_URL_POLKADOT || 'https://eth-asset-hub-paseo.dotters.network'),
    [celoAlfajores.id]: http(import.meta.env.VITE_RPC_URL_CELO || 'https://alfajores-forno.celo-testnet.org'),
    [celo.id]: http(import.meta.env.VITE_RPC_URL_CELO || 'https://forno.celo.org'),
    [base.id]: http(import.meta.env.VITE_RPC_URL_BASE || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || 'https://sepolia.base.org'),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
  connectors: [
    injected(),
  ],
});

export const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000001';
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7';

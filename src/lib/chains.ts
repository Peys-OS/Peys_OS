import type { Address } from "viem";

export interface ChainConfig {
  id: number;
  name: string;
  escrowContract: Address;
  usdcAddress: Address;
  usdtAddress: Address;
  rpcUrl: string;
  blockExplorer?: string;
}

export const chainConfigs: Record<number, ChainConfig> = {
  // Polkadot Asset Hub (EVM) - Testnet
  420420421: {
    id: 420420421,
    name: "Polkadot Asset Hub Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT || "") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_POLKADOT || "") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_POLKADOT || "") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_POLKADOT || "https://eth-asset-hub-paseo.dotters.network",
    blockExplorer: "https://polkadot.js.org/apps",
  },
  // Celo Alfajores (Testnet)
  44787: {
    id: 44787,
    name: "Celo Alfajores Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO || "") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_CELO || "") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_CELO || "") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_CELO || "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores-blockscout.celo-testnet.org",
  },
  // Base Sepolia (Testnet)
  84532: {
    id: 84532,
    name: "Base Sepolia Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA || "") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_BASE_SEPOLIA || "") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_BASE_SEPOLIA || "") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
  },
  // Celo Mainnet (placeholder)
  42220: {
    id: 42220,
    name: "Celo Mainnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO || "") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_CELO || "") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_CELO || "") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_CELO || "https://forno.celo.org",
    blockExplorer: "https://explorer.celo.org",
  },
  // Base Mainnet (placeholder)
  8453: {
    id: 8453,
    name: "Base Mainnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_BASE || "") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_BASE || "") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_BASE || "") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_BASE || "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
  },
};

export function getChainConfig(chainId: number): ChainConfig {
  return chainConfigs[chainId] || chainConfigs[420420421]; // Default to Polkadot Asset Hub
}

export function getDefaultChainId(): number {
  return 84532; // Base Sepolia
}

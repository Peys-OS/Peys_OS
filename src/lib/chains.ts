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
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT || "0x802A6843516f52144b3F1D04E5447A085d34aF37") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_POLKADOT || "0x0000000000000000000000000000000000000001") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_POLKADOT || "0x0000000000000000000000000000000000000001") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_POLKADOT || "https://eth-asset-hub-paseo.dotters.network",
    blockExplorer: "https://polkadot.js.org/apps",
  },
  // Celo Alfajores (Testnet)
  44787: {
    id: 44787,
    name: "Celo Alfajores Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO || "0xe41c86dF5BaCE6bEceD57Ecd916C7aE58a471C02") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_CELO || "0x0000000000000000000000000000000000000001") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_CELO || "0x0000000000000000000000000000000000000001") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_CELO || "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores-blockscout.celo-testnet.org",
  },
  // Base Sepolia (Testnet)
  84532: {
    id: 84532,
    name: "Base Sepolia Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA || "0x4a5a67a3666A3f26bF597AdC7c10EA89495e046c") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_BASE_SEPOLIA || "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_BASE_SEPOLIA || "0x0000000000000000000000000000000000000001") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
  },
  // Celo Mainnet (placeholder)
  42220: {
    id: 42220,
    name: "Celo Mainnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO || "0x0000000000000000000000000000000000000002") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_CELO || "0x0000000000000000000000000000000000000001") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_CELO || "0x0000000000000000000000000000000000000001") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_CELO || "https://forno.celo.org",
    blockExplorer: "https://explorer.celo.org",
  },
  // Base Mainnet (placeholder)
  8453: {
    id: 8453,
    name: "Base Mainnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_BASE || "0x0000000000000000000000000000000000000003") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_BASE || "0x0000000000000000000000000000000000000001") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_BASE || "0x0000000000000000000000000000000000000001") as Address,
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

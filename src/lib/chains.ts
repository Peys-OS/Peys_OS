import type { Address } from "viem";

export interface ChainConfig {
  id: number;
  name: string;
  escrowContract: Address;
  usdcAddress: Address;
  usdtAddress: Address;
  passAddress: Address;
  streamingContract?: Address;
  batchPayrollContract?: Address;
  rpcUrl: string;
  blockExplorer?: string;
  nativeSymbol: string;
}

export const chainConfigs: Record<number, ChainConfig> = {
  // Polkadot Asset Hub (Paseo Testnet) - Chain ID 420420417
  420420417: {
    id: 420420417,
    name: "Polkadot Asset Hub Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT || "0x802a6843516f52144b3f1d04e5447a085d34af37") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_POLKADOT || "0x0000000000000000000000000000000000000D39") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_POLKADOT || "") as Address,
    passAddress: (import.meta.env.VITE_PASS_ADDRESS_POLKADOT || "0x00000001000000000000000000000000000007c0") as Address,
    streamingContract: (import.meta.env.VITE_STREAMING_CONTRACT_ADDRESS_POLKADOT || "0xc9497Ec40951FbB98C02c666b7F9Fa143678E2Be") as Address,
    batchPayrollContract: (import.meta.env.VITE_BATCH_PAYROLL_CONTRACT_ADDRESS_POLKADOT || "0x802A6843516f52144b3F1D04E5447A085d34aF37") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_POLKADOT || "https://polkadot-westend.gateway.tatum.io",
    blockExplorer: "https://polkadot.testnet.routescan.io",
    nativeSymbol: "PAS",
  },
  // Legacy chain ID (for backward compatibility)
  420420421: {
    id: 420420421,
    name: "Polkadot Asset Hub Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT || "0x802a6843516f52144b3f1d04e5447a085d34af37") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_POLKADOT || "0x0000000000000000000000000000000000000D39") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_POLKADOT || "") as Address,
    passAddress: (import.meta.env.VITE_PASS_ADDRESS_POLKADOT || "0x00000001000000000000000000000000000007c0") as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_POLKADOT || "https://polkadot-westend.gateway.tatum.io",
    blockExplorer: "https://polkadot.testnet.routescan.io",
    nativeSymbol: "PAS",
  },
  // Celo Alfajores (Testnet)
  44787: {
    id: 44787,
    name: "Celo Alfajores Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO || "") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_CELO || "") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_CELO || "") as Address,
    passAddress: "" as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_CELO || "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores-blockscout.celo-testnet.org",
    nativeSymbol: "CELO",
  },
  // Base Sepolia (Testnet)
  84532: {
    id: 84532,
    name: "Base Sepolia Testnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA || "0x4a5a67a3666A3f26bF597AdC7c10EA89495e046c") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_BASE_SEPOLIA || "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_BASE_SEPOLIA || "") as Address,
    passAddress: "" as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    nativeSymbol: "ETH",
  },
  // Celo Mainnet
  42220: {
    id: 42220,
    name: "Celo Mainnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO || "") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_CELO || "") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_CELO || "") as Address,
    passAddress: "" as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_CELO || "https://forno.celo.org",
    blockExplorer: "https://explorer.celo.org",
    nativeSymbol: "CELO",
  },
  // Base Mainnet
  8453: {
    id: 8453,
    name: "Base Mainnet",
    escrowContract: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS_BASE || "") as Address,
    usdcAddress: (import.meta.env.VITE_USDC_ADDRESS_BASE || "") as Address,
    usdtAddress: (import.meta.env.VITE_USDT_ADDRESS_BASE || "") as Address,
    passAddress: "" as Address,
    rpcUrl: import.meta.env.VITE_RPC_URL_BASE || "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    nativeSymbol: "ETH",
  },
};

export function getChainConfig(chainId: number): ChainConfig {
  return chainConfigs[chainId] || chainConfigs[420420417];
}

export function getDefaultChainId(): number {
  return 420420417; // Polkadot Asset Hub (Paseo)
}

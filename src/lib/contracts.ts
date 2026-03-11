export const ESCROW_CONTRACT_ADDRESS = (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000001') as `0x${string}`;
export const USDC_ADDRESS = (import.meta.env.VITE_USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48') as `0x${string}`;
export const USDT_ADDRESS = (import.meta.env.VITE_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7') as `0x${string}`;
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network';

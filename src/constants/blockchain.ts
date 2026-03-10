import type { Address } from "viem";
import { ESCROW_ABI as CORRECT_ESCROW_ABI, ERC20_ABI } from "@/lib/abis";

// Re-export the correct ABIs from lib/abis.ts to avoid duplication
export { ERC20_ABI };
export const ESCROW_ABI = CORRECT_ESCROW_ABI;

export const ESCROW_CONTRACT_ADDRESS: Address = "0xc9497Ec40951FbB98C02c666b7F9Fa143678E2Be" as Address;
export const USDC_ADDRESS: Address = "0x5aD4d8d5D8e3b8dA4dC4f4F4f4f4f4f4f4f4f4f4f" as Address;
export const USDT_ADDRESS: Address = "0x5aD4d8d5D8e3b8dA4dC4f4F4f4f4f4f4f4f4f4f4f" as Address;
export const RPC_URL = "https://eth-asset-hub-paseo.dotters.network";

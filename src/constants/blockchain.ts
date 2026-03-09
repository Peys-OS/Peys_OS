import type { Address } from "viem";

export const ERC20_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "transfer", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

export const ESCROW_ABI = [
  { inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }, { name: "claimHash", type: "bytes32" }, { name: "expiry", type: "uint256" }, { name: "memo", type: "string" }], name: "createPaymentExternal", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "paymentId", type: "uint256" }, { name: "secret", type: "bytes32" }], name: "claimPayment", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "paymentId", type: "uint256" }], name: "refundPayment", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "paymentId", type: "uint256" }], name: "getPayment", outputs: [{ name: "", type: "tuple", components: [{ name: "sender", type: "address" }, { name: "token", type: "address" }, { name: "amount", type: "uint256" }, { name: "claimHash", type: "bytes32" }, { name: "expiry", type: "uint256" }, { name: "claimed", type: "bool" }, { name: "refunded", type: "bool" }, { name: "memo", type: "string" }] }], stateMutability: "view", type: "function" },
] as const;

export const ESCROW_CONTRACT_ADDRESS: Address = "0xc9497Ec40951FbB98C02c666b7F9Fa143678E2Be" as Address;
export const USDC_ADDRESS: Address = "0x5aD4d8d5D8e3b8dA4dC4f4F4f4f4f4f4f4f4f4f4f" as Address;
export const USDT_ADDRESS: Address = "0x5aD4d8d5D8e3b8dA4dC4f4F4f4f4f4f4f4f4f4f4f" as Address;
export const RPC_URL = "https://eth-asset-hub-paseo.dotters.network";

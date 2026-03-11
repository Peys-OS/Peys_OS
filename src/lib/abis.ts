export const ESCROW_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "bytes32", "name": "claimHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "expiry", "type": "uint256" },
      { "internalType": "string", "name": "memo", "type": "string" }
    ],
    "name": "createPaymentExternal",
    "outputs": [{ "internalType": "bytes32", "name": "paymentId", "type": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "bytes32", "name": "claimHash", "type": "bytes32" },
      { "internalType": "string", "name": "memo", "type": "string" }
    ],
    "name": "createPaymentWithDefaultExpiry",
    "outputs": [{ "internalType": "bytes32", "name": "paymentId", "type": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "paymentId", "type": "bytes32" },
      { "internalType": "bytes32", "name": "secretHash", "type": "bytes32" },
      { "internalType": "address", "name": "recipient", "type": "address" }
    ],
    "name": "claim",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "paymentId", "type": "bytes32" }],
    "name": "refundAfterExpiry",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "paymentId", "type": "bytes32" }],
    "name": "getPayment",
    "outputs": [
      { "internalType": "address", "name": "sender", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "expiry", "type": "uint256" },
      { "internalType": "bool", "name": "claimed", "type": "bool" },
      { "internalType": "bool", "name": "refunded", "type": "bool" },
      { "internalType": "string", "name": "memo", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "paymentId", "type": "bytes32" }],
    "name": "isPaymentExpired",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
    "name": "getContractTokenBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "paymentId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "expiry", "type": "uint256" },
      { "internalType": "string", "name": "memo", "type": "string" }
    ],
    "name": "PaymentCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "paymentId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "PaymentClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "paymentId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "PaymentRefunded",
    "type": "event"
  }
] as const;

export const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

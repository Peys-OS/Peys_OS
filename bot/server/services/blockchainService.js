/**
 * Blockchain Service for WhatsApp Bot
 * 
 * Interacts with PeysEscrow smart contracts on:
 * - Base Sepolia (testnet)
 * - Polkadot Asset Hub
 * - Celo Alfajores
 */

import { ethers } from 'ethers';

// ============================================================================
// Contract Addresses & Configuration
// ============================================================================

const NETWORKS = {
  base_sepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.VITE_RPC_URL_BASE_SEPOLIA || 'https://base-sepolia.g.alchemy.com/v2/H3-pV1jNnbXq7-6JEW8Gt',
    escrowAddress: process.env.VITE_ESCROW_CONTRACT_ADDRESS || '0x4a5a67a3666A3f26bF597AdC7c10EA89495e046c',
    usdcAddress: process.env.VITE_USDC_ADDRESS_BASE_SEPOLIA || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  polkadot: {
    chainId: 420420421,
    name: 'Polkadot Asset Hub',
    rpcUrl: process.env.VITE_RPC_URL_POLKADOT || 'https://eth-asset-hub-paseo.dotters.network',
    escrowAddress: process.env.VITE_ESCROW_CONTRACT_ADDRESS_POLKADOT || '0x802a6843516f52144b3f1d04e5447a085d34af37',
    usdcAddress: process.env.VITE_USDC_ADDRESS_POLKADOT || '0x0000000000000000000000000000000000000D39',
  },
  celo: {
    chainId: 44787,
    name: 'Celo Alfajores',
    rpcUrl: process.env.VITE_RPC_URL_CELO || 'https://celo-sepolia.g.alchemy.com/v2/H3-pV1jNnbXq7-6JEW8Gt',
    escrowAddress: process.env.VITE_ESCROW_CONTRACT_ADDRESS_CELO || '0xc880AF5d5aC3ea27c26C47D132661A710C245ea5',
    usdcAddress: process.env.VITE_USDC_ADDRESS_CELO || '0x01C5C0122039549AD1493B8220cABEdD739BC44E',
  }
};

// ============================================================================
// ABI for PeysEscrow Contract (key functions)
// ============================================================================

const ESCROW_ABI = [
  // Create payment
  'function createPayment(bytes32 paymentId, bytes32 secretHash, address recipient, uint256 amount, address token, uint256 expiry) external payable returns (bool)',
  // Claim payment
  'function claimPayment(bytes32 paymentId, bytes32 secret) external returns (bool)',
  // Refund payment
  'function refundPayment(bytes32 paymentId) external returns (bool)',
  // Get payment details
  'function getPayment(bytes32 paymentId) external view returns (address sender, address recipient, uint256 amount, address token, bytes32 secretHash, uint256 expiry, uint8 status)',
  // Check if payment is pending
  'function isPending(bytes32 paymentId) external view returns (bool)',
  // Events
  'event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address indexed recipient, uint256 amount, address token, uint256 expiry)',
  'event PaymentClaimed(bytes32 indexed paymentId, address indexed recipient, uint256 amount)',
  'event PaymentRefunded(bytes32 indexed paymentId, address indexed sender, uint256 amount)'
];

// ERC20 ABI for token operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 amount)'
];

// ============================================================================
// Blockchain Service Class
// ============================================================================

class BlockchainService {
  constructor() {
    this.networks = NETWORKS;
    this.providers = {};
    this.contracts = {};
    this.initialized = false;
  }

  /**
   * Initialize providers and contracts for all networks
   */
  async initialize() {
    try {
      for (const [networkName, config] of Object.entries(this.networks)) {
        try {
          // Create provider
          const provider = new ethers.JsonRpcProvider(config.rpcUrl);
          this.providers[networkName] = provider;

          // Create escrow contract instance (read-only)
          const escrowContract = new ethers.Contract(
            config.escrowAddress,
            ESCROW_ABI,
            provider
          );
          this.contracts[networkName] = escrowContract;

          // Test connection
          const blockNumber = await provider.getBlockNumber();
          console.log(`[Blockchain] ${config.name}: Connected (block ${blockNumber})`);
        } catch (error) {
          console.warn(`[Blockchain] ${config.name}: Connection failed - ${error.message}`);
        }
      }

      this.initialized = true;
      console.log('[Blockchain] Service initialized');
    } catch (error) {
      console.error('[Blockchain] Initialization error:', error.message);
    }
  }

  /**
   * Get provider for a network
   */
  getProvider(network = 'base_sepolia') {
    return this.providers[network];
  }

  /**
   * Get escrow contract for a network
   */
  getContract(network = 'base_sepolia') {
    return this.contracts[network];
  }

  // ========================================================================
  // Balance Operations
  // ========================================================================

  /**
   * Get token balance for an address
   */
  async getTokenBalance(tokenAddress, walletAddress, network = 'base_sepolia') {
    const provider = this.getProvider(network);
    if (!provider || !tokenAddress) {
      return '0';
    }

    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('[Blockchain] Error getting balance:', error.message);
      return '0';
    }
  }

  /**
   * Get USDC balance
   */
  async getUSDCBalance(walletAddress, network = 'base_sepolia') {
    const usdcAddress = this.networks[network]?.usdcAddress;
    if (!usdcAddress) return '0';
    return this.getTokenBalance(usdcAddress, walletAddress, network);
  }

  // ========================================================================
  // Escrow Operations
  // ========================================================================

  /**
   * Get payment details from escrow
   */
  async getPaymentDetails(paymentId, network = 'base_sepolia') {
    const contract = this.getContract(network);
    if (!contract) {
      return null;
    }

    try {
      const paymentIdBytes32 = ethers.id(paymentId).slice(0, 66);
      const details = await contract.getPayment(paymentIdBytes32);
      
      return {
        sender: details.sender,
        recipient: details.recipient,
        amount: ethers.formatUnits(details.amount, 6), // USDC has 6 decimals
        token: details.token,
        secretHash: details.secretHash,
        expiry: new Date(Number(details.expiry) * 1000),
        status: ['pending', 'claimed', 'refunded'][details.status] || 'unknown'
      };
    } catch (error) {
      console.error('[Blockchain] Error getting payment details:', error.message);
      return null;
    }
  }

  /**
   * Check if payment is pending
   */
  async isPaymentPending(paymentId, network = 'base_sepolia') {
    const contract = this.getContract(network);
    if (!contract) {
      return false;
    }

    try {
      const paymentIdBytes32 = ethers.id(paymentId).slice(0, 66);
      return await contract.isPending(paymentIdBytes32);
    } catch (error) {
      console.error('[Blockchain] Error checking payment status:', error.message);
      return false;
    }
  }

  // ========================================================================
  // Utility Functions
  // ========================================================================

  /**
   * Generate payment ID
   */
  generatePaymentId() {
    return ethers.randomBytes(32).slice(2); // Remove 0x prefix
  }

  /**
   * Generate secret and hash
   */
  generateSecret() {
    const secret = ethers.randomBytes(32);
    const hash = ethers.keccak256(secret);
    return {
      secret: secret.slice(2), // Remove 0x
      hash: hash.slice(2)      // Remove 0x
    };
  }

  /**
   * Format amount for blockchain (handle decimals)
   */
  formatAmount(amount, decimals = 6) {
    return ethers.parseUnits(amount.toString(), decimals);
  }

  /**
   * Parse amount from blockchain
   */
  parseAmount(amount, decimals = 6) {
    return ethers.formatUnits(amount, decimals);
  }

  /**
   * Get network info
   */
  getNetworkInfo(network = 'base_sepolia') {
    return this.networks[network];
  }

  /**
   * Check service health
   */
  async healthCheck() {
    const results = {};
    
    for (const [name, config] of Object.entries(this.networks)) {
      const provider = this.providers[name];
      if (provider) {
        try {
          const blockNumber = await provider.getBlockNumber();
          results[name] = { status: 'ok', blockNumber };
        } catch (error) {
          results[name] = { status: 'error', message: error.message };
        }
      } else {
        results[name] = { status: 'not_initialized' };
      }
    }
    
    return results;
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;

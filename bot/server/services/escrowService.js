const { ethers } = require('ethers');
const { db } = require('../models');

const ESCROW_ABI = [
  'function createPaymentExternal(address token, uint256 amount, bytes32 claimHash, uint256 expiry, string calldata memo) external returns (bytes32)',
  'function createPaymentWithDefaultExpiry(address token, uint256 amount, bytes32 claimHash, string calldata memo) external returns (bytes32)',
  'function claim(bytes32 paymentId, bytes32 secretHash, address recipient) external returns (uint256)',
  'function refundAfterExpiry(bytes32 paymentId) external',
  'function getPayment(bytes32 paymentId) external view returns (address sender, address token, uint256 amount, uint256 expiry, bool claimed, bool refunded, string memory memo)',
  'function isPaymentExpired(bytes32 paymentId) external view returns (bool)',
  'event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address token, uint256 amount, uint256 expiry, string memo)',
  'event PaymentClaimed(bytes32 indexed paymentId, address indexed recipient, uint256 amount)',
  'event PaymentRefunded(bytes32 indexed paymentId, address indexed sender, uint256 amount)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)'
];

class EscrowService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.escrowContract = new ethers.Contract(
      process.env.ESCROW_CONTRACT_ADDRESS,
      ESCROW_ABI,
      this.provider
    );
  }

  getSigner(privateKey) {
    return new ethers.Wallet(privateKey, this.provider);
  }

  getTokenContract(tokenAddress) {
    return new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
  }

  async createPayment(params) {
    const {
      senderAddress,
      senderEmail,
      recipientEmail,
      tokenAddress,
      tokenSymbol,
      amount,
      secret,
      memo,
      expiryDays = 7,
      privateKey
    } = params;

    const signer = this.getSigner(privateKey);
    const signerWithProvider = signer.connect(this.provider);
    
    const contract = this.escrowContract.connect(signerWithProvider);
    
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secret));
    const expiry = BigInt(expiryDays * 24 * 60 * 60);
    const amountWei = ethers.parseUnits(amount, 6);

    let tx;
    try {
      tx = await contract.createPaymentExternal(
        tokenAddress,
        amountWei,
        secretHash,
        expiry,
        memo || ''
      );
    } catch (error) {
      console.error('Contract call error:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }

    const receipt = await tx.wait();
    
    const paymentCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'PaymentCreated';
      } catch {
        return false;
      }
    });

    let paymentId;
    if (paymentCreatedEvent) {
      const parsed = contract.interface.parseLog(paymentCreatedEvent);
      paymentId = parsed.args.paymentId;
    } else {
      paymentId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'address', 'uint256', 'bytes32', 'uint256'],
          [senderAddress, tokenAddress, amountWei, secretHash, Date.now()]
        )
      );
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const payment = await db.Payment.create({
      paymentId,
      senderAddress,
      senderEmail,
      recipientEmail,
      tokenAddress,
      tokenSymbol,
      amount: amountWei.toString(),
      secretHash,
      memo: memo || '',
      expiry: expiryDate,
      status: 'pending',
      transactionHash: tx.hash,
    });

    return {
      paymentId,
      transactionHash: tx.hash,
      claimLink: `${process.env.APP_URL}/claim/${payment.id}`,
      expiry: expiryDate.toISOString(),
    };
  }

  async getPayment(paymentId) {
    const payment = await db.Payment.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    try {
      const onChainPayment = await this.escrowContract.getPayment(payment.paymentId);
      
      if (onChainPayment.claimed && payment.status !== 'claimed') {
        payment.status = 'claimed';
        await payment.save();
      } else if (onChainPayment.refunded && payment.status !== 'refunded') {
        payment.status = 'refunded';
        await payment.save();
      } else if (new Date() > new Date(payment.expiry) && payment.status === 'pending') {
        payment.status = 'expired';
        await payment.save();
      }
    } catch (error) {
      console.error('Error fetching on-chain payment:', error);
    }

    return {
      id: payment.id,
      paymentId: payment.paymentId,
      senderAddress: payment.senderAddress,
      amount: payment.amount,
      tokenSymbol: payment.tokenSymbol,
      memo: payment.memo,
      expiry: payment.expiry,
      status: payment.status,
    };
  }

  async claimPayment(params) {
    const { paymentId, secret, recipientAddress, recipientWallet, transactionHash } = params;

    const payment = await db.Payment.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'claimed') {
      throw new Error('Payment already claimed');
    }

    if (payment.status === 'refunded') {
      throw new Error('Payment already refunded');
    }

    if (new Date() > new Date(payment.expiry)) {
      payment.status = 'expired';
      await payment.save();
      throw new Error('Payment has expired');
    }

    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secret));
    if (secretHash !== payment.secretHash) {
      throw new Error('Invalid secret');
    }

    payment.status = 'claimed';
    payment.claimedAt = new Date();
    payment.recipientWallet = recipientWallet || recipientAddress;
    payment.claimTransactionHash = transactionHash;
    await payment.save();

    return {
      success: true,
      transactionHash,
    };
  }

  async getUserPayments(walletAddress) {
    const payments = await db.Payment.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { senderAddress: walletAddress },
          { recipientWallet: walletAddress },
        ],
      },
      order: [['createdAt', 'DESC']],
    });

    return payments;
  }

  async getTokenBalance(tokenAddress, walletAddress) {
    const contract = this.getTokenContract(tokenAddress);
    const balance = await contract.balanceOf(walletAddress);
    return balance.toString();
  }

  async getAllowance(tokenAddress, ownerAddress) {
    const contract = this.getTokenContract(tokenAddress);
    const allowance = await contract.allowance(ownerAddress, process.env.ESCROW_CONTRACT_ADDRESS);
    return allowance.toString();
  }
}

module.exports = new EscrowService();

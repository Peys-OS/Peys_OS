import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS, NetworkConfig, PaymentRequest } from '../types/index.js';

export interface EscrowTransaction {
  paymentId: string;
  amount: string;
  recipient: string;
  sender: string;
  commitHash: string;
  status: 'pending' | 'committed' | 'revealed' | 'completed' | 'refunded';
  network: string;
  txHash: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
}

export interface CommitRevealData {
  paymentId: string;
  secret: string;
  hash: string;
}

export class EscrowService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private network: NetworkConfig;

  constructor(network: keyof typeof SUPPORTED_NETWORKS = 'base-sepolia') {
    this.network = SUPPORTED_NETWORKS[network];
    this.provider = new ethers.JsonRpcProvider(this.network.rpcUrl);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', this.provider);
  }

  async createCommitHash(secret: string): Promise<string> {
    return ethers.keccak256(ethers.toUtf8Bytes(secret));
  }

  async createPayment(
    recipientAddress: string,
    commitHash: string,
    amount: string
  ): Promise<{ paymentId: string; txHash: string }> {
    const abi = [
      'function createPayment(address recipient, bytes32 commitHash) payable returns (bytes32)',
    ];
    const contract = new ethers.Contract(this.network.contractAddress, abi, this.wallet);
    
    const amountWei = ethers.parseUnits(amount, 6);
    
    const tx = await contract.createPayment(recipientAddress, commitHash, { value: amountWei }) as ethers.TransactionResponse;
    const receipt = await tx.wait();
    
    const paymentCreatedEvent = receipt.logs.find((log: ethers.Log) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'PaymentCreated';
      } catch {
        return false;
      }
    });

    let paymentId: string;
    if (paymentCreatedEvent) {
      paymentId = paymentCreatedEvent.args[0];
    } else {
      paymentId = ethers.keccak256(
        ethers.concat([
          ethers.toUtf8Bytes(recipientAddress),
          commitHash,
          ethers.toBeHex(ethers.toNumber(amountWei), 32),
        ])
      );
    }

    return { paymentId, txHash: tx.hash! };
  }

  async confirmPayment(paymentId: string, secret: string): Promise<string> {
    const abi = [
      'function confirmPayment(bytes32 paymentId, bytes32 secret) returns (bool)',
    ];
    const contract = new ethers.Contract(this.network.contractAddress, abi, this.wallet);
    
    const secretHash = await this.createCommitHash(secret);
    const tx = await contract.confirmPayment(paymentId, secretHash) as ethers.TransactionResponse;
    await tx.wait();
    
    return tx.hash!;
  }

  async refundPayment(paymentId: string, reason?: string): Promise<string> {
    const abi = [
      'function refundPayment(bytes32 paymentId) returns (bool)',
    ];
    const contract = new ethers.Contract(this.network.contractAddress, abi, this.wallet);
    
    const tx = await contract.refirmPayment(paymentId) as ethers.TransactionResponse;
    await tx.wait();
    
    return tx.hash!;
  }

  async getPaymentStatus(paymentId: string): Promise<{
    recipient: string;
    amount: string;
    status: number;
    createdAt: number;
  }> {
    const abi = [
      'function getPayment(bytes32 paymentId) view returns (address recipient, uint256 amount, uint8 status, uint256 createdAt)',
    ];
    const contract = new ethers.Contract(this.network.contractAddress, abi, this.provider);
    
    const payment = await contract.getPayment(paymentId);
    return {
      recipient: payment[0],
      amount: payment[1].toString(),
      status: payment[2],
      createdAt: Number(payment[3]),
    };
  }

  async emergencyWithdraw(paymentId: string): Promise<string> {
    const abi = [
      'function emergencyWithdraw(bytes32 paymentId) returns (bool)',
    ];
    const contract = new ethers.Contract(this.network.contractAddress, abi, this.wallet);
    
    const tx = await contract.emergencyWithdraw(paymentId) as ethers.TransactionResponse;
    await tx.wait();
    
    return tx.hash!;
  }

  generatePaymentId(): string {
    return ethers.id(Date.now().toString() + Math.random().toString()).slice(0, 36);
  }

  getExplorerUrl(txHash: string): string {
    return `${this.network.explorerUrl}/tx/${txHash}`;
  }

  getNetworkInfo(): NetworkConfig {
    return this.network;
  }
}

export const escrowService = new EscrowService();

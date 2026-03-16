import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ESCROW_ABI, ERC20_ABI } from '@/constants/blockchain';
import { getChainConfig } from '@/lib/chains';
import { useCallback } from 'react';
import { keccak256, toBytes, Address, Hex, PublicClient } from 'viem';

export interface Payment {
  sender: string;
  token: string;
  amount: bigint;
  expiry: bigint;
  claimed: boolean;
  refunded: boolean;
  memo: string;
}

export { getChainConfig };

export function useEscrow() {
  const { chain, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const getContractAddresses = useCallback(() => {
    const chainId = chain?.id || 84532;
    const config = getChainConfig(chainId);
    return {
      escrowContract: config.escrowContract,
      usdcAddress: config.usdcAddress,
      usdtAddress: config.usdtAddress,
    };
  }, [chain]);

  const checkAllowance = useCallback(async (
    tokenAddress: Address,
    amount: bigint
  ): Promise<boolean> => {
    if (!address || !publicClient) return false;
    
    try {
      const { escrowContract } = getContractAddresses();
      
      const allowanceData = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as Address, escrowContract as Address],
      });
      
      const currentAllowance = allowanceData as bigint;
      console.log(`Current allowance: ${currentAllowance}, Required: ${amount}`);
      
      return currentAllowance >= amount;
    } catch (error) {
      console.warn("Failed to check allowance:", error);
      return false;
    }
  }, [address, publicClient, getContractAddresses]);

  const createPayment = useCallback(async (
    tokenAddress: Address,
    amount: bigint,
    secret: string,
    memo: string,
    expiryDays: number = 7,
    onApprovalRequested?: () => void,
    onCreatingPayment?: () => void
  ): Promise<Hex | undefined> => {
    if (!walletClient) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    if (!address) {
      throw new Error("No wallet address found");
    }

    const claimHash = keccak256(toBytes(secret));
    const expiry = BigInt(expiryDays * 24 * 60 * 60);
    const { escrowContract, usdcAddress } = getContractAddresses();

    console.log("createPayment called", { tokenAddress, amount, escrowContract, usdcAddress, chainId: chain?.id });

    if (!chain) {
      throw new Error("No blockchain network detected. Please switch to a supported network in your wallet.");
    }

    const supportedChainIds = [84532, 44787, 420420421];
    if (!supportedChainIds.includes(chain.id)) {
      throw new Error(`Unsupported network. Please switch to Base Sepolia, Celo Alfajores, or Polkadot testnet.`);
    }

    if (!publicClient) {
      throw new Error("Public client not available. Please refresh the page.");
    }

    const pc = publicClient;
    
    // Check allowance first
    let hasAllowance = false;
    try {
      hasAllowance = await checkAllowance(tokenAddress, amount);
    } catch (e) {
      console.warn("Could not check allowance:", e);
    }
    
    if (!hasAllowance) {
      if (onApprovalRequested) {
        onApprovalRequested();
      }
      
      console.log("Sending approval transaction...");
      
      try {
        const simulation = await pc.simulateContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: [escrowContract, amount] as any,
          account: address,
        });
        
        const approvalHash = await walletClient.writeContract(simulation.request);
        console.log("Approval tx hash:", approvalHash);
        
        await pc.waitForTransactionReceipt({ hash: approvalHash });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (approveError: any) {
        console.error("Approval error:", approveError);
        
        const errorMsg = approveError?.message || '';
        const isRejected = errorMsg.includes('user rejected') || errorMsg.includes('cancelled') || errorMsg.includes('rejected');
        
        if (isRejected) {
          throw new Error("Transaction was cancelled. Please try again.");
        }
        
        console.log("Continuing despite approval error");
      }
    } else {
      console.log("Already have sufficient allowance, skipping approval");
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (onCreatingPayment) {
      onCreatingPayment();
    }

    console.log("=== Creating Payment Transaction ===");
    console.log("Sending createPayment transaction...");
    
    try {
      const simulation = await pc.simulateContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'createPaymentExternal',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [tokenAddress, amount, claimHash, expiry, memo] as any,
        account: address,
      });
      
      const txHash = await walletClient.writeContract(simulation.request);
      
      console.log("=== Payment Transaction Submitted ===");
      console.log("Transaction hash:", txHash);
      console.log("Transaction hash type:", typeof txHash);
      
      if (!txHash) {
        throw new Error("Transaction was submitted but no hash was returned");
      }
      
      return txHash;
      
    } catch (createError: any) {
      console.error("=== Create Payment Error ===");
      console.error("Error:", createError);
      console.error("Error message:", createError?.message);
      
      const errorMsg = createError?.message || '';
      
      if (errorMsg.includes('user rejected') || errorMsg.includes('cancelled') || errorMsg.includes('rejected')) {
        throw new Error("Transaction was cancelled. Please try again.");
      }
      
      if (errorMsg.includes('execution reverted')) {
        throw new Error(`Transaction failed on-chain: ${errorMsg.slice(0, 100)}`);
      }
      
      if (errorMsg.includes('chain')) {
        throw new Error("Network mismatch. Please switch to the correct network.");
      }
      
      throw new Error(`Failed to create payment: ${errorMsg || 'Unknown error'}`);
    }
  }, [walletClient, address, chain, publicClient, checkAllowance, getContractAddresses]);

  const getPayment = useCallback(async (paymentId: Hex): Promise<{
    sender: string;
    token: string;
    amount: bigint;
    expiry: bigint;
    claimed: boolean;
    refunded: boolean;
    memo: string;
  } | null> => {
    if (!publicClient) {
      console.error("Public client not available");
      return null;
    }

    const { escrowContract } = getContractAddresses();

    try {
      const result = await publicClient.readContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'getPayment',
        args: [paymentId],
      });
      
      return {
        sender: result[0],
        token: result[1],
        amount: result[2],
        expiry: result[3],
        claimed: result[4],
        refunded: result[5],
        memo: result[6],
      };
    } catch (error) {
      console.error("Error fetching payment:", error);
      return null;
    }
  }, [publicClient, getContractAddresses]);

  const claimPayment = useCallback(async (
    paymentId: Hex,
    secret: string
  ): Promise<Hex | undefined> => {
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }

    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const { escrowContract } = getContractAddresses();
    const secretHash = keccak256(toBytes(secret));

    try {
      const simulation = await publicClient.simulateContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'claim',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [paymentId, secretHash, address as Address] as any,
        account: address,
      });

      const txHash = await walletClient.writeContract(simulation.request);
      return txHash;
    } catch (error: any) {
      console.error("Claim error:", error);
      throw new Error(`Failed to claim: ${error.message}`);
    }
  }, [walletClient, address, publicClient, getContractAddresses]);

  const refundPayment = useCallback(async (paymentId: Hex): Promise<Hex | undefined> => {
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }

    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const { escrowContract } = getContractAddresses();

    try {
      const simulation = await publicClient.simulateContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'refundAfterExpiry',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: [paymentId] as any,
        account: address,
      });

      const txHash = await walletClient.writeContract(simulation.request);
      return txHash;
    } catch (error: any) {
      console.error("Refund error:", error);
      throw new Error(`Failed to refund: ${error.message}`);
    }
  }, [walletClient, address, publicClient, getContractAddresses]);

  return {
    createPayment,
    claimPayment,
    refundPayment,
    getPayment,
  };
}

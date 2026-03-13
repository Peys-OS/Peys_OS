import { useAccount, useWalletClient } from 'wagmi';
import { ESCROW_ABI, ERC20_ABI } from '@/constants/blockchain';
import { getChainConfig, type ChainConfig } from '@/lib/chains';
import { useCallback } from 'react';
import { keccak256, toBytes, Address, Hex, parseUnits, PublicClient } from 'viem';

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

  const getContractAddresses = useCallback(() => {
    const chainId = chain?.id || 84532; // Default to Base Sepolia
    const config = getChainConfig(chainId);
    return {
      escrowContract: config.escrowContract,
      usdcAddress: config.usdcAddress,
      usdtAddress: config.usdtAddress,
    };
  }, [chain]);

  const checkAllowance = useCallback(async (
    publicClient: PublicClient,
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
  }, [address, getContractAddresses]);

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

    // Validate chain is supported
    if (!chain) {
      throw new Error("No blockchain network detected. Please switch to a supported network in your wallet.");
    }

    const supportedChainIds = [84532, 44787, 420420421];
    if (!supportedChainIds.includes(chain.id)) {
      throw new Error(`Unsupported network. Please switch to Base Sepolia, Celo Alfajores, or Polkadot testnet.`);
    }

    const publicClient = walletClient.chain?.id 
      ? walletClient.chain?.id === chain.id 
        ? walletClient.extend((client: any) => ({
            ...client,
            chain: { ...client.chain, id: chain.id }
          }))
        : undefined
      : undefined;

    // Get public client from wallet
    const { publicClient: pc } = walletClient as any;
    
    // Check allowance first
    let hasAllowance = false;
    try {
      hasAllowance = await checkAllowance(pc, tokenAddress, amount);
    } catch (e) {
      console.warn("Could not check allowance:", e);
    }
    
    if (!hasAllowance) {
      if (onApprovalRequested) {
        onApprovalRequested();
      }
      
      console.log("Sending approval transaction...");
      
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        
        // Wait for approval receipt
        await pc.waitForTransactionReceipt({ hash: approvalHash });
        
        // Delay to ensure nonce is released
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (approveError: any) {
        console.error("Approval error:", approveError);
        
        const errorMsg = approveError?.message || '';
        const isRejected = 
          errorMsg.includes('user rejected') ||
          errorMsg.includes('cancelled') ||
          errorMsg.includes('rejected');
        
        if (isRejected) {
          throw new Error("Transaction was cancelled. Please try again.");
        }
        
        // Continue anyway - maybe already approved
        console.log("Continuing despite approval error");
      }
    } else {
      console.log("Already have sufficient allowance, skipping approval");
    }

    // Add delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Signal that we're creating the payment
    if (onCreatingPayment) {
      onCreatingPayment();
    }

    // Now send the createPayment transaction
    console.log("=== Creating Payment Transaction ===");
    console.log("Sending createPayment transaction...");
    
    try {
      console.log("Calling writeContract with:", {
        address: escrowContract,
        functionName: 'createPaymentExternal',
        args: [tokenAddress, amount, claimHash, expiry, memo]
      });
      
      // Simulate first to check for errors
      const simulation = await pc.simulateContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'createPaymentExternal',
        args: [tokenAddress, amount, claimHash, expiry, memo] as never,
        account: address,
      });
      
      // Send the transaction
      const txHash = await walletClient.writeContract(simulation.request) as Hex;
      
      console.log("=== Payment Transaction Submitted ===");
      console.log("Transaction hash:", txHash);
      
      return txHash;
      
    } catch (createError: any) {
      console.error("=== Create Payment Error ===");
      console.error("Error:", createError);
      console.error("Error message:", createError?.message);
      
      const errorMsg = createError?.message || '';
      
      // Check for user rejection
      if (errorMsg.includes('user rejected') || 
          errorMsg.includes('cancelled') ||
          errorMsg.includes('rejected')) {
        throw new Error("Transaction was cancelled. Please try again.");
      }
      
      // Check for contract revert
      if (errorMsg.includes('execution reverted')) {
        throw new Error(`Transaction failed on-chain: ${errorMsg.slice(0, 100)}`);
      }
      
      // Check for chain mismatch
      if (errorMsg.includes('chain')) {
        throw new Error("Network mismatch. Please switch to the correct network.");
      }
      
      throw new Error(`Failed to create payment: ${errorMsg || 'Unknown error'}`);
    }
  }, [walletClient, address, chain, checkAllowance, getContractAddresses]);

  const claimPayment = useCallback(async (
    paymentId: Hex,
    secret: string
  ): Promise<Hex | undefined> => {
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }

    const { escrowContract } = getContractAddresses();
    const secretHash = keccak256(toBytes(secret));

    try {
      const { publicClient: pc } = walletClient as any;
      
      const { request } = await pc.simulateContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'claim',
        args: [paymentId, secretHash, address as Address],
        account: address,
      });

      const txHash = await walletClient.writeContract(request);
      return txHash;
    } catch (error: any) {
      console.error("Claim error:", error);
      throw new Error(`Failed to claim: ${error.message}`);
    }
  }, [walletClient, address, getContractAddresses]);

  const refundPayment = useCallback(async (paymentId: Hex): Promise<Hex | undefined> => {
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }

    const { escrowContract } = getContractAddresses();

    try {
      const { publicClient: pc } = walletClient as any;
      
      const { request } = await pc.simulateContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'refundAfterExpiry',
        args: [paymentId],
        account: address,
      });

      const txHash = await walletClient.writeContract(request);
      return txHash;
    } catch (error: any) {
      console.error("Refund error:", error);
      throw new Error(`Failed to refund: ${error.message}`);
    }
  }, [walletClient, address, getContractAddresses]);

  return {
    createPayment,
    claimPayment,
    refundPayment,
  };
}

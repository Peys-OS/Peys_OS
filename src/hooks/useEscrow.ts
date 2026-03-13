import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, usePublicClient } from 'wagmi';
import { ESCROW_ABI, ERC20_ABI } from '@/constants/blockchain';
import { getChainConfig } from '@/lib/chains';
import { useCallback } from 'react';
import { keccak256, toBytes, Address, Hex } from 'viem';

export interface Payment {
  sender: string;
  token: string;
  amount: bigint;
  expiry: bigint;
  claimed: boolean;
  refunded: boolean;
  memo: string;
}

export function useEscrow() {
  const { data: hash, writeContract, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash 
  });
  const { chain, address } = useAccount();
  const publicClient = usePublicClient();

  const getContractAddresses = useCallback(() => {
    const chainId = chain?.id || 84532; // Default to Base Sepolia
    const config = getChainConfig(chainId);
    return {
      escrowContract: config.escrowContract,
      usdcAddress: config.usdcAddress,
      usdtAddress: config.usdtAddress,
    };
  }, [chain]);

  const checkAllowance = useCallback(async (tokenAddress: Address, amount: bigint): Promise<boolean> => {
    if (!address || !publicClient) return false;
    
    try {
      const { escrowContract } = getContractAddresses();
      
      // Read allowance from the contract
      const allowanceData = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as Address, escrowContract as Address],
      } as any);
      
      const currentAllowance = allowanceData as bigint;
      console.log(`Current allowance: ${currentAllowance}, Required: ${amount}`);
      
      return currentAllowance >= amount;
    } catch (error) {
      console.warn("Failed to check allowance:", error);
      // If we can't check allowance, assume we need to approve
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
    const claimHash = keccak256(toBytes(secret));
    const expiry = BigInt(expiryDays * 24 * 60 * 60);
    const { escrowContract, usdcAddress } = getContractAddresses();

    console.log("createPayment called", { tokenAddress, amount, escrowContract, usdcAddress, chainId: chain?.id });

    // Validate wallet is connected
    if (!address) {
      console.error("No wallet address found");
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    // Validate chain is supported
    if (!chain) {
      console.error("No chain connected");
      throw new Error("No blockchain network detected. Please switch to a supported network in your wallet.");
    }

    // Check if we're on a supported network
    const supportedChainIds = [84532, 44787, 420420421]; // Base Sepolia, Celo Alfajores, Polkadot
    if (!supportedChainIds.includes(chain.id)) {
      console.error("Unsupported chain:", chain.id);
      throw new Error(`Unsupported network. Please switch to Base Sepolia, Celo Alfajores, or Polkadot testnet. Current: ${chain.name} (${chain.id})`);
    }

    if (!writeContract) {
      console.error("writeContract is not available - wallet may not be connected");
      throw new Error("Wallet not ready. Please make sure your wallet is connected and unlocked.");
    }

    // Check if we have sufficient allowance (non-blocking, best-effort)
    let hasAllowance = false;
    try {
      hasAllowance = await checkAllowance(tokenAddress, amount);
    } catch (e) {
      console.warn("Could not check allowance, will attempt approval:", e);
    }
    
    if (!hasAllowance) {
      // Need to approve first
      if (onApprovalRequested) {
        onApprovalRequested();
      }
      
      console.log("Sending approval transaction...");
      let approvalHash: Hex | undefined;
      
      // Send approval transaction
      try {
        console.log("Sending approval transaction to:", usdcAddress);
        const result = await writeContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [escrowContract, amount],
        } as any);
        
        console.log("Approval result:", result, "type:", typeof result);
        approvalHash = result as unknown as Hex | undefined;
        
        if (result === undefined || result === null) {
          console.log("Approval returned undefined - checking if user rejected");
          throw new Error("APPROVAL_REJECTED");
        }
        
        console.log("Approval tx hash:", approvalHash);
      } catch (approveError: any) {
        console.error("Approval error:", approveError);
        console.error("Approval error message:", approveError?.message);
        console.error("Approval error code:", approveError?.code);
        console.error("Approval error name:", approveError?.name);
        
        // If user rejected, that's okay - they might have already approved
        const isRejected = 
          approveError?.code === 4001 ||
          approveError?.code === 'ACTION_REJECTED' ||
          approveError?.message?.includes('user rejected') ||
          approveError?.message?.includes('cancelled') ||
          approveError?.message?.includes('User rejected') ||
          approveError?.name === 'UserRejectedRequestError' ||
          approveError?.name === 'UserRejectedRequest' ||
          approveError?.message?.includes('APPROVAL_REJECTED');
        
        if (isRejected) {
          console.log("Approval rejected by user - continuing anyway");
          // Continue anyway - maybe allowance was already set
        } else {
          console.warn("Approval transaction failed:", approveError);
          // Don't throw - continue and try anyway in case approval already happened
        }
      }

      // Wait for approval to be confirmed if we got a hash
      if (approvalHash && publicClient) {
        try {
          console.log("Waiting for approval receipt...");
          const receipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
          console.log("Approval receipt:", receipt.status);
          // Longer delay to ensure nonce is properly released
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (receiptError: any) {
          console.warn("Failed to wait for approval receipt:", receiptError);
          // Continue anyway - might have gone through
        }
      }
    } else {
      console.log("Already have sufficient allowance, skipping approval");
    }

    // Add a small delay to ensure wallet is ready for next transaction
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Signal that we're now creating the payment
    if (onCreatingPayment) {
      onCreatingPayment();
    }

    // Now send the createPayment transaction
    console.log("Sending createPayment transaction...");
    let tx: Hex | undefined;
    
    try {
      console.log("Calling writeContract with:", {
        address: escrowContract,
        functionName: 'createPaymentExternal',
        args: [tokenAddress, amount, claimHash, expiry, memo]
      });
      
      const result = await writeContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'createPaymentExternal',
        args: [tokenAddress, amount, claimHash, expiry, memo],
      } as any);
      
      console.log("CreatePayment result:", result, "type:", typeof result);
      tx = result as unknown as Hex | undefined;
      
      // Check if result is undefined or null
      if (result === undefined || result === null) {
        console.log("writeContract returned undefined/null - checking wagmi state");
        throw new Error("TRANSACTION_REJECTED");
      }
    } catch (createError: any) {
      console.error("Create payment error:", createError);
      console.error("Error code:", createError?.code);
      console.error("Error message:", createError?.message);
      console.error("Error name:", createError?.name);
      console.error("Error type:", typeof createError);
      
      // Check for common wallet rejection patterns
      const isRejected = 
        createError?.code === 4001 ||
        createError?.code === 'ACTION_REJECTED' ||
        createError?.message?.includes('user rejected') ||
        createError?.message?.includes('cancelled') ||
        createError?.message?.includes('Transaction rejected') ||
        createError?.message?.includes('User rejected') ||
        createError?.name === 'UserRejectedRequestError' ||
        createError?.name === 'UserRejectedRequest' ||
        createError?.message?.includes('TRANSACTION_REJECTED');
      
      if (isRejected) {
        console.log("Transaction rejected by user");
        throw new Error("Transaction was cancelled. Please try again.");
      }
      
      // If it's a contract revert error
      if (createError.message?.includes('execution reverted') || createError.message?.includes('0x')) {
        throw new Error(`Transaction failed on-chain. The contract may have rejected it. Please check: ${createError.message?.slice(0, 100)}`);
      }
      
      // If it's a chain mismatch error
      if (createError.message?.includes('chain') || createError.message?.includes('network')) {
        throw new Error("Network mismatch. Please switch to the correct network in your wallet and try again.");
      }
      
      // If it's a wallet connection issue
      if (createError.message?.includes('wallet') || createError.message?.includes('connector')) {
        throw new Error("Wallet connection issue. Please reconnect your wallet and try again.");
      }
      
      throw new Error(`Failed to create payment: ${createError.message || 'Unknown error'}`);
    }

    // Check if tx is undefined - this happens when user rejects the transaction or wallet error
    if (!tx) {
      console.error("Transaction returned undefined - user may have rejected");
      throw new Error("Transaction was not submitted. This usually means the transaction was cancelled or rejected in your wallet. Please try again and confirm the transaction.");
    }

    return tx as unknown as Hex | undefined;
  }, [writeContract, publicClient, checkAllowance, getContractAddresses]);

  const claimPayment = useCallback(async (
    paymentId: Hex,
    secret: string
  ): Promise<Hex | undefined> => {
    const secretHash = keccak256(toBytes(secret));
    const { escrowContract } = getContractAddresses();

    if (!writeContract) {
      console.error("writeContract is not available");
      return undefined;
    }

    const tx = await writeContract({
      address: escrowContract,
      abi: ESCROW_ABI,
      functionName: 'claim',
      args: [paymentId, secretHash],
    } as any);

    return tx as unknown as Hex | undefined;
  }, [writeContract, getContractAddresses]);

  const refundPayment = useCallback(async (paymentId: Hex): Promise<Hex | undefined> => {
    const { escrowContract } = getContractAddresses();

    if (!writeContract) {
      console.error("writeContract is not available");
      return undefined;
    }

    const tx = await writeContract({
      address: escrowContract,
      abi: ESCROW_ABI,
      functionName: 'refundAfterExpiry',
      args: [paymentId],
    } as any);

    return tx as unknown as Hex | undefined;
  }, [writeContract, getContractAddresses]);

  return {
    createPayment,
    claimPayment,
    refundPayment,
    getContractAddresses,
    hash,
    isWriting,
    isConfirming,
    isSuccess,
  };
}

export function usePayment(paymentId: Hex | undefined, chainId?: number) {
  const { escrowContract } = getChainConfig(chainId || 420420421);
  
  const { data } = useReadContract({
    address: escrowContract,
    abi: ESCROW_ABI,
    functionName: 'getPayment',
    args: paymentId !== undefined ? [paymentId] : undefined,
    query: {
      enabled: paymentId !== undefined,
    },
  });

  if (!data) return null;

  return {
    sender: data[0],
    token: data[1],
    amount: data[2],
    expiry: data[3],
    claimed: data[4],
    refunded: data[5],
    memo: data[6],
  } as unknown as Payment;
}

export function useTokenBalance(tokenAddress: Address, walletAddress: Address | undefined) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress && !!tokenAddress,
    },
  });

  return {
    balance: data ?? BigInt(0),
    isLoading,
    isError,
    refetch,
  };
}

export function useAllowance(tokenAddress: Address, owner: Address | undefined, chainId?: number) {
  const { escrowContract } = getChainConfig(chainId || 420420421);
  
  const { data, isError, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner ? [owner, escrowContract] : undefined,
    query: {
      enabled: !!owner,
    },
  });

  return {
    allowance: data ?? BigInt(0),
    isLoading,
    isError,
    refetch,
  };
}

export function useApproveToken(chainId?: number) {
  const { data: hash, writeContract, isPending: isWriting } = useWriteContract();
  const { escrowContract } = getChainConfig(chainId || 420420421);

  const approve = useCallback(async (tokenAddress: Address, amount: bigint) => {
    const tx = await writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [escrowContract, amount],
    } as any);

    return tx;
  }, [writeContract, escrowContract]);

  return {
    approve,
    hash,
    isWriting,
  };
}

export { getChainConfig };

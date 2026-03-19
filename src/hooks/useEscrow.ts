import { useAccount, usePublicClient } from 'wagmi';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import { ESCROW_ABI, ERC20_ABI } from '@/constants/blockchain';
import { getChainConfig } from '@/lib/chains';
import { useCallback } from 'react';
import { keccak256, toBytes, Address, Hex, encodeFunctionData } from 'viem';

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
  const publicClient = usePublicClient();
  const { sendTransaction } = useSendTransaction();
  const { wallets } = useWallets();

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
    if (!address) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    const claimHash = keccak256(toBytes(secret));
    const expiry = BigInt(expiryDays * 24 * 60 * 60);
    const { escrowContract } = getContractAddresses();

    console.log("createPayment called", { tokenAddress, amount, escrowContract, chainId: chain?.id });
    
    const isNativeToken = tokenAddress.startsWith("0x00000001") || tokenAddress.startsWith("0x0000000100000000");
    console.log("Is native token:", isNativeToken);
    
    const pc = publicClient;
    
    // Native tokens don't need approval
    if (!isNativeToken) {
      let hasAllowance = false;
      try {
        hasAllowance = await checkAllowance(tokenAddress, amount);
        console.log("Allowance check result:", hasAllowance);
      } catch (e) {
        console.warn("Could not check allowance:", e);
      }
      
      if (!hasAllowance) {
        if (onApprovalRequested) {
          onApprovalRequested();
        }
        
        console.log("Sending approval transaction...");
        
        try {
          const approvalData = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [escrowContract, amount],
          });
          
          const approvalTx = {
            to: tokenAddress,
            data: approvalData,
            value: BigInt(0),
          };
          
          const result = await sendTransaction(approvalTx);
          console.log("Approval tx hash:", result.hash);
          
          if (result.hash) {
            if (pc) {
              await pc.waitForTransactionReceipt({ hash: result.hash });
            }
          }
        } catch (approveError: unknown) {
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
    } else {
      console.log("Native token - skipping approval step");
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (onCreatingPayment) {
      onCreatingPayment();
    }

    console.log("=== Create Payment Parameters ===");
    console.log("Token Address:", tokenAddress);
    console.log("Amount:", amount.toString());
    console.log("Escrow Contract:", escrowContract);
    console.log("Chain:", chain?.id, chain?.name);
    console.log("Is Native Token:", isNativeToken);
    
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Invalid token address: ${tokenAddress}. Please select a valid token.`);
    }
    
    try {
      const createPaymentData = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'createPaymentExternal',
        args: [tokenAddress, amount, claimHash, expiry, memo],
      });
      
      const tx = {
        to: escrowContract,
        data: createPaymentData,
        value: BigInt(0),
      };
      
      const result = await sendTransaction(tx);
      console.log("=== Payment Transaction Submitted ===");
      console.log("Transaction hash:", result.hash);
      
      if (!result.hash) {
        throw new Error("Transaction was submitted but no hash was returned");
      }
      
      return result.hash as Hex;
      
    } catch (createError: unknown) {
      console.error("=== Create Payment Error ===");
      console.error("Full error object:", createError);
      console.error("Error message:", createError?.message);
      console.error("Error shortMessage:", createError?.shortMessage);
      console.error("Error cause:", createError?.cause);
      console.error("Error details:", createError?.details);
      
      const errorMsg = createError?.message || '';
      
      if (errorMsg.includes('user rejected') || errorMsg.includes('cancelled') || errorMsg.includes('rejected')) {
        throw new Error("Transaction was cancelled. Please try again.");
      }
      
      if (errorMsg.includes('execution reverted') || errorMsg.includes('reverted')) {
        const revertReason = createError?.details || createError?.cause?.message || errorMsg;
        throw new Error(`Transaction reverted: ${revertReason}`);
      }
      
      if (errorMsg.includes('chain')) {
        throw new Error("Network mismatch. Please switch to the correct network.");
      }
      
      throw new Error(`Failed to create payment: ${errorMsg || 'Unknown error'}`);
    }
  }, [address, chain, publicClient, checkAllowance, getContractAddresses, sendTransaction]);

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
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const { escrowContract } = getContractAddresses();
    const secretHash = keccak256(toBytes(secret));

    try {
      const claimData = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'claim',
        args: [paymentId, secretHash],
      });
      
      const tx = {
        to: escrowContract,
        data: claimData,
        value: BigInt(0),
      };
      
      const result = await sendTransaction(tx);
      return result.hash as Hex;
    } catch (error: unknown) {
      console.error("Claim error:", error);
      const err = error as Error;
      throw new Error(`Failed to claim: ${err.message}`);
    }
  }, [address, publicClient, getContractAddresses, sendTransaction]);

  const refundPayment = useCallback(async (paymentId: Hex): Promise<Hex | undefined> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const { escrowContract } = getContractAddresses();

    try {
      const refundData = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'refundAfterExpiry',
        args: [paymentId],
      });
      
      const tx = {
        to: escrowContract,
        data: refundData,
        value: BigInt(0),
      };
      
      const result = await sendTransaction(tx);
      return result.hash as Hex;
    } catch (error: unknown) {
      console.error("Refund error:", error);
      const err = error as Error;
      throw new Error(`Failed to refund: ${err.message}`);
    }
  }, [address, publicClient, getContractAddresses, sendTransaction]);

  const estimateGas = useCallback(async (
    tokenAddress: Address,
    amount: bigint,
    secret: string,
    memo: string,
    expiryDays: number = 7
  ): Promise<bigint | undefined> => {
    if (!address || !publicClient) {
      throw new Error("Wallet not connected or public client not available");
    }

    const claimHash = keccak256(toBytes(secret));
    const expiry = BigInt(expiryDays * 24 * 60 * 60);
    const { escrowContract } = getContractAddresses();

    try {
      const gasEstimate = await publicClient.estimateContractGas({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'createPaymentExternal',
        args: [tokenAddress, amount, claimHash, expiry, memo] as readonly [Address, bigint, Hex, bigint, string],
        account: address,
      });

      return gasEstimate;
    } catch (error: unknown) {
      console.error("Gas estimation error:", error);
      const err = error as Error;
      throw new Error(`Failed to estimate gas: ${err.message}`);
    }
  }, [address, publicClient, getContractAddresses]);

  return {
    createPayment,
    claimPayment,
    refundPayment,
    getPayment,
    estimateGas,
  };
}

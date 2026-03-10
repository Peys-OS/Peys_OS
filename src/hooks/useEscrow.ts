import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
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
  const { chain } = useAccount();

  const getContractAddresses = useCallback(() => {
    const chainId = chain?.id || 420420421; // Default to Polkadot Asset Hub
    const config = getChainConfig(chainId);
    return {
      escrowContract: config.escrowContract,
      usdcAddress: config.usdcAddress,
      usdtAddress: config.usdtAddress,
    };
  }, [chain]);

  const createPayment = useCallback(async (
    tokenAddress: Address,
    amount: bigint,
    secret: string,
    memo: string,
    expiryDays: number = 7
  ): Promise<Hex | undefined> => {
    const claimHash = keccak256(toBytes(secret));
    const expiry = BigInt(expiryDays * 24 * 60 * 60);
    const { escrowContract } = getContractAddresses();

    if (!writeContract) {
      console.error("writeContract is not available");
      return undefined;
    }

    const tx = await writeContract({
      address: escrowContract,
      abi: ESCROW_ABI,
      functionName: 'createPaymentExternal',
      args: [tokenAddress, amount, claimHash, expiry, memo],
    } as any);

    // wagmi v3 might have type inference issues, cast through unknown
    return tx as unknown as Hex | undefined;
  }, [writeContract, getContractAddresses]);

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

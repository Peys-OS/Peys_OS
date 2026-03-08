import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { ESCROW_ABI, ERC20_ABI } from '../lib/abis';
import { ESCROW_CONTRACT_ADDRESS, USDC_ADDRESS, USDT_ADDRESS } from '../lib/contracts';
import { useCallback } from 'react';
import { keccak256, toBytes, Address } from 'viem';

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

  const createPayment = useCallback(async (
    tokenAddress: Address,
    amount: bigint,
    secret: string,
    memo: string,
    expiryDays: number = 7
  ) => {
    const claimHash = keccak256(toBytes(secret));
    const expiry = BigInt(expiryDays * 24 * 60 * 60);

    const tx = await writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'createPaymentExternal',
      args: [tokenAddress, amount, claimHash, expiry, memo],
    } as any);

    return tx;
  }, [writeContract]);

  const claimPayment = useCallback(async (
    paymentId: bigint,
    secret: string
  ) => {
    const secretHash = keccak256(toBytes(secret));

    const tx = await writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'claim',
      args: [paymentId, secretHash],
    } as any);

    return tx;
  }, [writeContract]);

  const refundPayment = useCallback(async (paymentId: bigint) => {
    const tx = await writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'refundAfterExpiry',
      args: [paymentId],
    } as any);

    return tx;
  }, [writeContract]);

  return {
    createPayment,
    claimPayment,
    refundPayment,
    hash,
    isWriting,
    isConfirming,
    isSuccess,
  };
}

export function usePayment(paymentId: bigint | undefined) {
  const { data } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
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

export function useAllowance(tokenAddress: Address, owner: Address | undefined) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner ? [owner, ESCROW_CONTRACT_ADDRESS] : undefined,
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

export function useApproveToken() {
  const { data: hash, writeContract, isPending: isWriting } = useWriteContract();

  const approve = useCallback(async (tokenAddress: Address, amount: bigint) => {
    const tx = await writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ESCROW_CONTRACT_ADDRESS, amount],
    } as any);

    return tx;
  }, [writeContract]);

  return {
    approve,
    hash,
    isWriting,
  };
}

export { USDC_ADDRESS, USDT_ADDRESS, ESCROW_CONTRACT_ADDRESS };

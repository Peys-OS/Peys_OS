import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePrivyAuth } from "@/contexts/PrivyContext";
import { createPublicClient, http, formatUnits, type Address } from "viem";
import { ERC20_ABI } from "@/lib/abis";
import { USDC_ADDRESS, USDT_ADDRESS, RPC_URL } from "@/lib/contracts";
import type { Transaction } from "@/hooks/useMockData";

interface UserWallet {
  address: string;
  balanceUSDC: number;
  balanceUSDT: number;
}

export type { UserWallet };

interface AppContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  wallet: UserWallet;
  transactions: Transaction[];
  walletAddress: string;
  refreshBalances: () => void;
}

const defaultTransactions: Transaction[] = [
  { id: "1", type: "sent", amount: 50, token: "USDC", counterparty: "moses@email.com", memo: "Lunch money 🍕", timestamp: new Date(Date.now() - 3600000), claimLink: "abc123" },
  { id: "2", type: "claimed", amount: 200, token: "USDT", counterparty: "alice@email.com", memo: "Freelance payment", timestamp: new Date(Date.now() - 86400000) },
  { id: "3", type: "pending", amount: 100, token: "USDC", counterparty: "bob@email.com", timestamp: new Date(Date.now() - 7200000), claimLink: "def456", expiresAt: new Date(Date.now() + 86400000 * 6) },
  { id: "4", type: "claimed", amount: 75, token: "USDC", counterparty: "grace@email.com", memo: "Birthday gift 🎂", timestamp: new Date(Date.now() - 172800000) },
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Viem public client for Westend Asset Hub
const publicClient = createPublicClient({
  chain: {
    id: 420420421,
    name: "Westend Asset Hub",
    nativeCurrency: { name: "Westend", symbol: "WND", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  },
  transport: http(RPC_URL),
});

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading, login, logout, walletAddress } = usePrivyAuth();
  const [transactions] = useState<Transaction[]>(defaultTransactions);
  const [balanceUSDC, setBalanceUSDC] = useState(0);
  const [balanceUSDT, setBalanceUSDT] = useState(0);

  const shortAddr = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "Not connected";

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !isLoggedIn) {
      setBalanceUSDC(0);
      setBalanceUSDT(0);
      return;
    }

    const addr = walletAddress as Address;

    try {
      // Fetch USDC balance (skip if address not configured)
      if (USDC_ADDRESS !== ZERO_ADDRESS) {
        const [rawUSDC, decimalsUSDC] = await Promise.all([
          publicClient.readContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [addr],
          }),
          publicClient.readContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "decimals",
          }).catch(() => 6), // default to 6 decimals for USDC
        ]);
        setBalanceUSDC(Number(formatUnits(rawUSDC, Number(decimalsUSDC))));
      }

      // Fetch USDT balance (skip if address not configured)
      if (USDT_ADDRESS !== ZERO_ADDRESS) {
        const [rawUSDT, decimalsUSDT] = await Promise.all([
          publicClient.readContract({
            address: USDT_ADDRESS,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [addr],
          }),
          publicClient.readContract({
            address: USDT_ADDRESS,
            abi: ERC20_ABI,
            functionName: "decimals",
          }).catch(() => 6), // default to 6 decimals for USDT
        ]);
        setBalanceUSDT(Number(formatUnits(rawUSDT, Number(decimalsUSDT))));
      }
    } catch (err) {
      console.warn("Balance fetch failed (tokens may not be deployed yet):", err);
    }
  }, [walletAddress, isLoggedIn]);

  // Auto-fetch on login / wallet change
  useEffect(() => {
    fetchBalances();
    // Poll every 30s while logged in
    if (isLoggedIn && walletAddress) {
      const interval = setInterval(fetchBalances, 30_000);
      return () => clearInterval(interval);
    }
  }, [fetchBalances, isLoggedIn, walletAddress]);

  const wallet: UserWallet = {
    address: shortAddr,
    balanceUSDC,
    balanceUSDT,
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        login,
        logout,
        wallet,
        transactions,
        walletAddress,
        refreshBalances: fetchBalances,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

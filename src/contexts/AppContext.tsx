import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePrivyAuth } from "@/contexts/PrivyContext";
import { createPublicClient, http, formatUnits, type Address } from "viem";
import { ERC20_ABI } from "@/lib/abis.ts";
import { USDC_ADDRESS, USDT_ADDRESS, RPC_URL } from "@/lib/contracts.ts";
import { supabase } from "@/integrations/supabase/client";
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
  refreshTransactions: () => void;
  transactionsLoading: boolean;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
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

    const readBalance = async (tokenAddr: Address) => {
      const [raw, dec] = await Promise.all([
        (publicClient as any).readContract({
          address: tokenAddr,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [addr],
        }) as Promise<bigint>,
        ((publicClient as any).readContract({
          address: tokenAddr,
          abi: ERC20_ABI,
          functionName: "decimals",
        }) as Promise<number>).catch(() => 6),
      ]);
      return Number(formatUnits(raw, Number(dec)));
    };

    try {
      if (USDC_ADDRESS !== ZERO_ADDRESS) {
        setBalanceUSDC(await readBalance(USDC_ADDRESS));
      }
      if (USDT_ADDRESS !== ZERO_ADDRESS) {
        setBalanceUSDT(await readBalance(USDT_ADDRESS));
      }
    } catch (err) {
      console.warn("Balance fetch failed (tokens may not be deployed yet):", err);
    }
  }, [walletAddress, isLoggedIn]);

  // Fetch real transactions from Supabase
  const fetchTransactions = useCallback(async () => {
    if (!isLoggedIn) {
      setTransactions([]);
      return;
    }

    setTransactionsLoading(true);
    try {
      // Get current user's profile to find their email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTransactions([]);
        setTransactionsLoading(false);
        return;
      }

      const userEmail = user.email || "";

      // Fetch payments where user is sender OR recipient
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .or(`sender_user_id.eq.${user.id},recipient_email.eq.${userEmail}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching payments:", error);
        setTransactions([]);
        setTransactionsLoading(false);
        return;
      }

      const mapped: Transaction[] = (payments || []).map((p) => {
        let type: Transaction["type"];
        if (p.status === "claimed") {
          type = p.sender_user_id === user.id ? "sent" : "claimed";
        } else if (p.status === "pending") {
          type = p.sender_user_id === user.id ? "pending" : "pending";
        } else {
          type = "sent";
        }

        // Show the other party
        const counterparty =
          p.sender_user_id === user.id ? p.recipient_email : p.sender_email;

        return {
          id: p.id,
          type,
          amount: Number(p.amount),
          token: (p.token === "USDT" ? "USDT" : "USDC") as "USDC" | "USDT",
          counterparty,
          memo: p.memo || undefined,
          timestamp: new Date(p.created_at),
          claimLink: p.claim_link || undefined,
          expiresAt: p.expires_at ? new Date(p.expires_at) : undefined,
        };
      });

      setTransactions(mapped);
    } catch (err) {
      console.error("Transaction fetch error:", err);
    } finally {
      setTransactionsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchBalances();
    if (isLoggedIn && walletAddress) {
      const interval = setInterval(fetchBalances, 30_000);
      return () => clearInterval(interval);
    }
  }, [fetchBalances, isLoggedIn, walletAddress]);

  // Fetch transactions on login
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
        refreshTransactions: fetchTransactions,
        transactionsLoading,
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

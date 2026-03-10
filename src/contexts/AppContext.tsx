import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePrivyAuth } from "@/contexts/PrivyContext";
import { createPublicClient, http, formatUnits, type Address } from "viem";
import { ERC20_ABI } from "@/constants/blockchain";
import { chainConfigs } from "@/lib/chains";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction } from "@/hooks/useMockData";

// Network balance interface
export interface NetworkBalance {
  chainId: number;
  networkName: string;
  usdc: number;
  usdt: number;
  nativeToken: number;
  nativeSymbol: string;
}

interface UserWallet {
  address: string;
  balanceUSDC: number;
  balanceUSDT: number;
  totalBalanceUSD: number;
  networkBalances: NetworkBalance[];
}

export type { UserWallet, NetworkBalance };

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
  selectedNetwork: number | null;
  setSelectedNetwork: (network: number | null) => void;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const AppContext = createContext<AppContextType | null>(null);

// Create public clients for each network
const publicClients = Object.entries(chainConfigs).reduce((acc, [chainId, config]) => {
  acc[Number(chainId)] = createPublicClient({
    chain: {
      id: config.id,
      name: config.name,
      nativeCurrency: { 
        name: config.name.includes("Polkadot") ? "DOT" : config.name.includes("Celo") ? "CELO" : "ETH",
        symbol: config.name.includes("Polkadot") ? "DOT" : config.name.includes("Celo") ? "CELO" : "ETH",
        decimals: 18 
      },
      rpcUrls: { default: { http: [config.rpcUrl] } },
    },
    transport: http(config.rpcUrl),
  });
  return acc;
}, {} as Record<number, ReturnType<typeof createPublicClient>>);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading, login, logout, walletAddress } = usePrivyAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [balanceUSDC, setBalanceUSDC] = useState(0);
  const [balanceUSDT, setBalanceUSDT] = useState(0);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0);
  const [networkBalances, setNetworkBalances] = useState<NetworkBalance[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<number | null>(null);

  const shortAddr = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "Not connected";

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !isLoggedIn) {
      setBalanceUSDC(0);
      setBalanceUSDT(0);
      setTotalBalanceUSD(0);
      setNetworkBalances([]);
      return;
    }

    const addr = walletAddress as Address;
    const netBalances: NetworkBalance[] = [];
    let totalUSDC = 0;
    let totalUSDT = 0;

    const readBalance = async (client: typeof publicClients[number], tokenAddr: Address) => {
      if (tokenAddr === ZERO_ADDRESS) return 0;
      try {
        const [raw] = await Promise.all([
          (client as any).readContract({
            address: tokenAddr,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [addr],
          }) as Promise<bigint>,
        ]);
        return Number(formatUnits(raw, 6)); // USDC/USDT have 6 decimals
      } catch (err) {
        console.warn(`Failed to read balance for ${tokenAddr}:`, err);
        return 0;
      }
    };

    const readNativeBalance = async (client: typeof publicClients[number], config: typeof chainConfigs[number]) => {
      try {
        const balance = await client.getBalance({ address: addr });
        return Number(formatUnits(balance, 18));
      } catch (err) {
        return 0;
      }
    };

    // Fetch balances from all networks
    await Promise.all(
      Object.entries(chainConfigs).map(async ([chainId, config]) => {
        const client = publicClients[Number(chainId)];
        const [usdcBalance, usdtBalance, nativeBalance] = await Promise.all([
          readBalance(client, config.usdcAddress),
          readBalance(client, config.usdtAddress),
          readNativeBalance(client, config),
        ]);

        const nativeSymbol = config.name.includes("Polkadot") 
          ? "DOT" 
          : config.name.includes("Celo") 
            ? "CELO" 
            : "ETH";

        netBalances.push({
          chainId: Number(chainId),
          networkName: config.name,
          usdc: usdcBalance,
          usdt: usdtBalance,
          nativeToken: nativeBalance,
          nativeSymbol,
        });

        totalUSDC += usdcBalance;
        totalUSDT += usdtBalance;
      })
    );

    // Sort by total balance (USDC + USDT) descending
    netBalances.sort((a, b) => (b.usdc + b.usdt) - (a.usdc + a.usdt));

    setBalanceUSDC(totalUSDC);
    setBalanceUSDT(totalUSDT);
    setTotalBalanceUSD(totalUSDC + totalUSDT);
    setNetworkBalances(netBalances);
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
    totalBalanceUSD,
    networkBalances,
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
        selectedNetwork,
        setSelectedNetwork,
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

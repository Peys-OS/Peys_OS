import { createContext, useContext, useState, ReactNode } from "react";
import { usePrivyAuth } from "@/contexts/PrivyContext";
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
}

const defaultTransactions: Transaction[] = [
  { id: "1", type: "sent", amount: 50, token: "USDC", counterparty: "moses@email.com", memo: "Lunch money 🍕", timestamp: new Date(Date.now() - 3600000), claimLink: "abc123" },
  { id: "2", type: "claimed", amount: 200, token: "USDT", counterparty: "alice@email.com", memo: "Freelance payment", timestamp: new Date(Date.now() - 86400000) },
  { id: "3", type: "pending", amount: 100, token: "USDC", counterparty: "bob@email.com", timestamp: new Date(Date.now() - 7200000), claimLink: "def456", expiresAt: new Date(Date.now() + 86400000 * 6) },
  { id: "4", type: "claimed", amount: 75, token: "USDC", counterparty: "grace@email.com", memo: "Birthday gift 🎂", timestamp: new Date(Date.now() - 172800000) },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading, login, logout, walletAddress } = usePrivyAuth();
  const [transactions] = useState<Transaction[]>(defaultTransactions);

  const shortAddr = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "Not connected";

  // TODO: Replace with real on-chain balance fetching
  const wallet: UserWallet = {
    address: shortAddr,
    balanceUSDC: 0,
    balanceUSDT: 0,
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

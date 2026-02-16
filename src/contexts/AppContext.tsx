import { createContext, useContext, useState, ReactNode } from "react";
import type { UserWallet, Transaction } from "@/hooks/useMockData";

interface AppContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  wallet: UserWallet;
  transactions: Transaction[];
}

const defaultWallet: UserWallet = {
  address: "0x1a2B...9f4E",
  balanceUSDC: 1250.0,
  balanceUSDT: 340.5,
};

const defaultTransactions: Transaction[] = [
  { id: "1", type: "sent", amount: 50, token: "USDC", counterparty: "moses@email.com", memo: "Lunch money 🍕", timestamp: new Date(Date.now() - 3600000), claimLink: "abc123" },
  { id: "2", type: "claimed", amount: 200, token: "USDT", counterparty: "alice@email.com", memo: "Freelance payment", timestamp: new Date(Date.now() - 86400000) },
  { id: "3", type: "pending", amount: 100, token: "USDC", counterparty: "bob@email.com", timestamp: new Date(Date.now() - 7200000), claimLink: "def456", expiresAt: new Date(Date.now() + 86400000 * 6) },
  { id: "4", type: "claimed", amount: 75, token: "USDC", counterparty: "grace@email.com", memo: "Birthday gift 🎂", timestamp: new Date(Date.now() - 172800000) },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        login: () => setIsLoggedIn(true),
        logout: () => setIsLoggedIn(false),
        wallet: defaultWallet,
        transactions: defaultTransactions,
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

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {PrivyProvider as PrivyReactProvider, usePrivy, useWallets, User} from '@privy-io/react-auth';

interface PeyDotUser {
  id: string;
  email?: string;
  phone?: string;
  wallet?: {
    address: string;
  };
}

interface AppContextType {
  user: PeyDotUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  wallet: {
    address: string;
    balanceUSDC: number;
    balanceUSDT: number;
  };
  connectWallet: () => Promise<void>;
  ready: boolean;
}

const mockWallet = {
  address: '0x1a2B...9f4E',
  balanceUSDC: 1250.0,
  balanceUSDT: 340.5,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppPrivyProvider({ children }: { children: ReactNode }) {
  const { login, logout: privyLogout, user: privyUser, ready } = usePrivy();
  const { wallets } = useWallets();
  
  const [isLoading, setIsLoading] = useState(false);
  const [embeddedWalletAddress, setEmbeddedWalletAddress] = useState<string>('');

  useEffect(() => {
    if (wallets.length > 0) {
      const embedded = wallets.find(w => w.walletClientType === 'privy');
      if (embedded) {
        setEmbeddedWalletAddress(embedded.address);
      }
    }
  }, [wallets]);

  const connectWallet = useCallback(async () => {
    if (!ready) return;
    
    try {
      setIsLoading(true);
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [login, ready]);

  const handleLogout = useCallback(async () => {
    try {
      await privyLogout();
      setEmbeddedWalletAddress('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [privyLogout]);

  const wallet = embeddedWalletAddress ? {
    address: embeddedWalletAddress.slice(0, 6) + '...' + embeddedWalletAddress.slice(-4),
    balanceUSDC: mockWallet.balanceUSDC,
    balanceUSDT: mockWallet.balanceUSDT,
  } : mockWallet;

  const user: PeyDotUser | null = privyUser ? {
    id: privyUser.id,
    email: privyUser.email?.address,
    phone: privyUser.phone?.number,
    wallet: embeddedWalletAddress ? {
      address: embeddedWalletAddress,
    } : undefined,
  } : null;

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn: !!privyUser && ready,
        isLoading,
        login: connectWallet,
        logout: handleLogout,
        wallet,
        connectWallet,
        ready,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function usePeyDot() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('usePeyDot must be inside AppPrivyProvider');
  return ctx;
}

export function useWalletBalance() {
  const { wallet } = usePeyDot();
  return {
    totalBalance: wallet.balanceUSDC + wallet.balanceUSDT,
    usdcBalance: wallet.balanceUSDC,
    usdtBalance: wallet.balanceUSDT,
  };
}

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PrivyProvider as PrivyReactProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { defineChain } from 'viem';

// Westend Asset Hub EVM testnet chain definition
const westendAssetHub = defineChain({
  id: 420420421,
  name: 'Westend Asset Hub',
  network: 'westend-asset-hub',
  nativeCurrency: { name: 'Westend', symbol: 'WND', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://westend-asset-hub-eth-rpc.polkadot.io'] },
    public: { http: ['https://westend-asset-hub-eth-rpc.polkadot.io'] },
  },
  testnet: true,
});

// Privy App ID — publishable client key, safe in code
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'your-privy-app-id';

interface PeyDotUser {
  id: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
}

interface PrivyAuthContextType {
  user: PeyDotUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  ready: boolean;
  login: () => void;
  logout: () => Promise<void>;
  walletAddress: string;
}

const PrivyAuthContext = createContext<PrivyAuthContextType | null>(null);

function PrivyAuthInner({ children }: { children: ReactNode }) {
  const { login, logout: privyLogout, user: privyUser, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Track embedded wallet address
  useEffect(() => {
    if (wallets.length > 0) {
      const embedded = wallets.find((w) => w.walletClientType === 'privy');
      const external = wallets.find((w) => w.walletClientType !== 'privy');
      const preferred = embedded || external;
      if (preferred) setWalletAddress(preferred.address);
    } else {
      setWalletAddress('');
    }
  }, [wallets]);

  const handleLogin = useCallback(() => {
    if (!ready) return;
    setIsLoading(true);
    login();
    // isLoading will be reset once `authenticated` changes
  }, [login, ready]);

  useEffect(() => {
    if (ready) setIsLoading(false);
  }, [authenticated, ready]);

  const handleLogout = useCallback(async () => {
    try {
      await privyLogout();
      setWalletAddress('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [privyLogout]);

  const user: PeyDotUser | null = privyUser
    ? {
        id: privyUser.id,
        email: privyUser.email?.address,
        phone: privyUser.phone?.number,
        walletAddress: walletAddress || undefined,
      }
    : null;

  return (
    <PrivyAuthContext.Provider
      value={{
        user,
        isLoggedIn: authenticated && ready,
        isLoading,
        ready,
        login: handleLogin,
        logout: handleLogout,
        walletAddress,
      }}
    >
      {children}
    </PrivyAuthContext.Provider>
  );
}

/**
 * Top-level Privy provider — wrap your entire app with this.
 * Configures Privy with Westend Asset Hub chain and all login methods.
 */
export function PrivyAppProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyReactProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#10b981',
          logo: undefined,
        },
        loginMethods: ['email', 'google', 'apple', 'twitter', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: westendAssetHub,
        supportedChains: [westendAssetHub],
      }}
    >
      <PrivyAuthInner>{children}</PrivyAuthInner>
    </PrivyReactProvider>
  );
}

/**
 * Hook to access Privy auth state throughout the app.
 */
export function usePrivyAuth() {
  const ctx = useContext(PrivyAuthContext);
  if (!ctx) throw new Error('usePrivyAuth must be inside PrivyAppProvider');
  return ctx;
}

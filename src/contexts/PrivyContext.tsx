import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PrivyProvider as PrivyReactProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { defineChain } from 'viem';
import { baseSepolia, celoAlfajores } from 'viem/chains';

// Paseo Asset Hub EVM testnet chain definition
const paseoAssetHub = defineChain({
  id: 420420421,
  name: 'Paseo Asset Hub',
  nativeCurrency: { name: 'Paseo', symbol: 'PAS', decimals: 18 },
  rpcUrls: {
    default: { 
      http: [
        import.meta.env.VITE_RPC_URL_POLKADOT || 'https://eth-asset-hub-paseo.dotters.network',
        'https://paseo-rpc.dotters.network',
        'https://westend-asset-hub-eth-rpc.polkadot.io',
        'https://polkadot-westend.gateway.tatum.io',
      ] 
    },
  },
  testnet: true,
});

// Privy App ID — publishable client key, safe in code
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmlpmbwgn00cb0dicbfwdkz40';

interface PeysUser {
  id: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
}

interface PrivyAuthContextType {
  user: PeysUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  ready: boolean;
  login: () => void;
  loginWithEmailOnly: (prefillEmail?: string) => void;
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

  const handleLoginWithEmailOnly = useCallback((prefillEmail?: string) => {
    if (!ready) return;
    setIsLoading(true);
    login({
      loginMethods: ['email'],
      ...(prefillEmail && { prefill: { type: 'email', value: prefillEmail } }),
    });
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

  const user: PeysUser | null = privyUser
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
        loginWithEmailOnly: handleLoginWithEmailOnly,
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
 * Configures Privy with Paseo Asset Hub chain and all login methods.
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
        loginMethods: ['email', 'phone', 'google', 'apple', 'twitter', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',  // Fixed: was 'users-without-wallet'
          },
        },
        defaultChain: baseSepolia,
        supportedChains: [paseoAssetHub, baseSepolia, celoAlfajores],
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

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cm2m9hn2190h1l7h8fy5pq1p4';

if (!PRIVY_APP_ID) {
  throw new Error('Missing VITE_PRIVY_APP_ID environment variable');
}

export function PrivyProvider({ children }) {
  return (
    <PrivyProviderBase
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#6C63FF',
          logo: 'https://peysdot-magic-links.vercel.app/logo.png',
        },
        loginMethods: ['email', 'phone', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'allUsers',
        },
        defaultChain: 8453,
        supportedChains: [8453, 84532],
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}

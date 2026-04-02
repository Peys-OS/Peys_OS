import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

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
        defaultChain: 84532, // Base Sepolia
        supportedChains: [84532, 420420421, 44787], // Base Sepolia, Polkadot, Celo
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}

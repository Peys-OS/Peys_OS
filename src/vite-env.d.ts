/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID: string;
  readonly VITE_PRIVY_APP_SECRET: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS: string;
  readonly VITE_USDC_ADDRESS: string;
  readonly VITE_USDT_ADDRESS: string;
  readonly VITE_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/ai": {
        target: "http://localhost:11434",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai/, "/api/chat"),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Keep React and wagmi together to avoid context issues
          if (id.includes('node_modules/wagmi') || id.includes('node_modules/viem') || id.includes('node_modules/react')) {
            return 'vendor-web3';
          }
          // Group wallet connections
          if (id.includes('node_modules/@walletconnect') || id.includes('node_modules/@metamask')) {
            return 'vendor-wallet';
          }
          // Privy auth
          if (id.includes('node_modules/@privy-io')) {
            return 'vendor-privy';
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui';
          }
          // Charts
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
}));

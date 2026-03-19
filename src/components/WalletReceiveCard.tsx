import { useState } from "react";
import { Copy, Download, Check, ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface NetworkInfo {
  id: number;
  name: string;
  shortName: string;
  color: string;
  usdcAddress: string;
}

const NETWORKS: NetworkInfo[] = [
  { id: 84532, name: "Base Sepolia", shortName: "Base", color: "#0056FF", usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" },
  { id: 44787, name: "Celo Alfajores", shortName: "Celo", color: "#35D07F", usdcAddress: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" },
];

interface WalletReceiveCardProps {
  address: string;
}

export default function WalletReceiveCard({ address }: WalletReceiveCardProps) {
  const [copied, setCopied] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkInfo>(NETWORKS[0]);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Wallet address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const svg = document.getElementById("wallet-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = "pey-wallet-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast.success("QR code downloaded!");
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card sm:rounded-2xl sm:p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Receive Deposits</p>
        <div className="relative">
          <button
            onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <div 
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: selectedNetwork.color }}
            />
            {selectedNetwork.name}
            <ChevronDown className={`h-3 w-3 transition-transform ${showNetworkDropdown ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showNetworkDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 z-10 w-40 overflow-hidden rounded-lg border border-border bg-card shadow-elevated"
              >
                {NETWORKS.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => {
                      setSelectedNetwork(network);
                      setShowNetworkDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-secondary ${selectedNetwork.id === network.id ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
                  >
                    <div 
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: network.color }}
                    />
                    {network.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <p className="mb-4 text-xs text-muted-foreground">
        Send {selectedNetwork.shortName} USDC to this address to receive funds in your Peys account.
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="rounded-xl border border-border bg-background p-3">
          <QRCodeSVG
            id="wallet-qr-code"
            value={address}
            size={140}
            level="H"
            fgColor="hsl(var(--foreground))"
            bgColor="hsl(var(--background))"
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <p className="break-all text-xs font-mono text-foreground">{address}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyAddress}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={downloadQR}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" /> Save QR
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

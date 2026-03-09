import { useState } from "react";
import { Copy, Download, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface WalletReceiveCardProps {
  address: string;
}

export default function WalletReceiveCard({ address }: WalletReceiveCardProps) {
  const [copied, setCopied] = useState(false);

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
      <p className="mb-3 text-sm font-medium text-foreground">Receive Deposits</p>
      <p className="mb-4 text-xs text-muted-foreground">
        Send USDC or USDT on Paseo Asset Hub to this address.
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

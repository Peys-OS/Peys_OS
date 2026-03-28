import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, QrCode, Mail, Wallet, Building2, ExternalLink, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { flutterwaveService, SUPPORTED_COUNTRIES } from "@/services/flutterwaveService";

interface ReceiveModalProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
}

type ReceiveMethod = "email" | "wallet" | "fiat";

interface VirtualAccount {
  id: string;
  account_number: string;
  bank_name: string;
  currency: string;
}

export default function ReceiveModal({ open, onClose, walletAddress }: ReceiveModalProps) {
  const [method, setMethod] = useState<ReceiveMethod>("wallet");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState("base-sepolia");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const networks = [
    { id: "base-sepolia", name: "Base Sepolia", icon: "🔵", color: "blue" },
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣", color: "purple" },
    { id: "celo-alfajores", name: "Celo Alfajores", icon: "🟢", color: "green" },
  ];

  useEffect(() => {
    if (open && walletAddress) {
      fetchUserEmail();
      fetchVirtualAccounts();
    }
  }, [open, walletAddress]);

  const fetchUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUserEmail(user.email);
    }
  };

  const fetchVirtualAccounts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("virtual_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      setVirtualAccounts(data || []);
    } catch (error) {
      console.error("Failed to fetch virtual accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const createPaymentLink = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter an amount");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const paymentLink = `https://peys.app/pay/${crypto.randomUUID().slice(0, 8)}`;
      
      toast.success("Payment link created!", {
        description: paymentLink,
        action: {
          label: "Copy",
          onClick: () => copyToClipboard(paymentLink, "payment-link"),
        },
      });

      copyToClipboard(paymentLink, "payment-link");
    } catch (error) {
      toast.error("Failed to create payment link");
    } finally {
      setLoading(false);
    }
  };

  const getNetworkAddress = (networkId: string) => {
    return walletAddress;
  };

  const selectedNetworkData = networks.find(n => n.id === selectedNetwork);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-elevated overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg text-foreground">Receive Funds</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setMethod("wallet")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    method === "wallet" 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Wallet className="h-4 w-4" /> Crypto
                </button>
                <button
                  onClick={() => setMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    method === "email" 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Mail className="h-4 w-4" /> Payment Link
                </button>
                <button
                  onClick={() => setMethod("fiat")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    method === "fiat" 
                      ? "border-green-500 bg-green-500/5 text-green-500" 
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Building2 className="h-4 w-4" /> Fiat
                </button>
              </div>

              {/* Crypto Wallet Address */}
              {method === "wallet" && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium">Network</label>
                    <div className="relative">
                      <select
                        value={selectedNetwork}
                        onChange={(e) => setSelectedNetwork(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 appearance-none"
                      >
                        {networks.map((network) => (
                          <option key={network.id} value={network.id}>
                            {network.icon} {network.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/50 p-4">
                    <p className="mb-2 text-xs text-muted-foreground">Your {selectedNetworkData?.name} Address</p>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 font-mono text-sm text-foreground break-all">
                        {walletAddress}
                      </p>
                      <button
                        onClick={() => copyToClipboard(walletAddress, "address")}
                        className="shrink-0 rounded-lg p-2 hover:bg-background"
                      >
                        {copied === "address" ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(walletAddress, "address")}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
                    >
                      <Copy className="h-4 w-4" /> Copy Address
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary">
                      <QrCode className="h-4 w-4" /> QR Code
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Only send {selectedNetworkData?.name} assets to this address
                  </p>
                </div>
              )}

              {/* Email Payment Link */}
              {method === "email" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Create a payment link and share it via email. The sender can pay you directly using USDC.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Amount (USDC)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Description (Optional)</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this payment for?"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3"
                    />
                  </div>

                  {userEmail && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground mb-1">Send payment link to</p>
                      <p className="font-medium text-sm">{userEmail}</p>
                    </div>
                  )}

                  <button
                    onClick={createPaymentLink}
                    disabled={loading || !amount}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4" /> Create & Share Link
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Fiat Virtual Account */}
              {method === "fiat" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-500 text-sm font-medium mb-2">
                      <Building2 className="h-4 w-4" />
                      Virtual Bank Account
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Receive fiat deposits directly to your bank account. Funds are converted to USDC.
                    </p>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : virtualAccounts.length > 0 ? (
                    <div className="space-y-3">
                      {virtualAccounts.map((account) => (
                        <div key={account.id} className="rounded-xl border border-border bg-secondary/50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">{account.bank_name}</p>
                            <span className="text-xs text-muted-foreground">{account.currency}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="flex-1 font-mono text-lg font-bold tracking-wider">
                              {account.account_number}
                            </p>
                            <button
                              onClick={() => copyToClipboard(account.account_number, account.id)}
                              className="rounded-lg p-2 hover:bg-background"
                            >
                              {copied === account.id ? (
                                <Check className="h-5 w-5 text-green-500" />
                              ) : (
                                <Copy className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Building2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No virtual accounts yet
                      </p>
                      <a
                        href="/receive"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      >
                        <Plus className="h-4 w-4" /> Create Virtual Account
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Share this account number to receive fiat deposits
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ArrowRight, Check, Wallet, Building2 } from "lucide-react";
import { toast } from "sonner";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  balanceUSDC: number;
  balanceUSDT: number;
}

type WithdrawMethod = "wallet" | "bank";
type Token = "USDC" | "USDT";

export default function WithdrawModal({ open, onClose, balanceUSDC, balanceUSDT }: WithdrawModalProps) {
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [method, setMethod] = useState<WithdrawMethod>("wallet");
  const [token, setToken] = useState<Token>("USDC");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [processing, setProcessing] = useState(false);

  const balance = token === "USDC" ? balanceUSDC : balanceUSDT;

  const reset = () => {
    setStep("form");
    setAmount("");
    setAddress("");
    setProcessing(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep("done");
      toast.success("Withdrawal initiated! 🏦");
    }, 2000);
  };

  const fee = 0.50;
  const numAmount = Number(amount) || 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          onClick={handleClose}
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
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg text-foreground">Withdraw</h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {step === "form" && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {/* Method */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setMethod("wallet")}
                        className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                          method === "wallet" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <Wallet className="h-4 w-4" /> External Wallet
                      </button>
                      <button
                        onClick={() => setMethod("bank")}
                        className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                          method === "bank" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <Building2 className="h-4 w-4" /> Bank Account
                      </button>
                    </div>

                    {/* Token */}
                    <div className="flex gap-2">
                      {(["USDC", "USDT"] as Token[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setToken(t)}
                          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                            token === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Amount */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-muted-foreground">Amount</label>
                        <button onClick={() => setAmount(balance.toString())} className="text-xs text-primary hover:underline">
                          Max: ${balance.toFixed(2)}
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-border bg-background py-3 pl-9 pr-4 text-xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="mb-1.5 block text-xs text-muted-foreground">
                        {method === "wallet" ? "Wallet Address" : "Bank Details"}
                      </label>
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={method === "wallet" ? "0x... or ENS name" : "Account number or IBAN"}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!amount || numAmount <= 0) { toast.error("Enter a valid amount"); return; }
                        if (numAmount > balance) { toast.error("Insufficient balance"); return; }
                        if (!address) { toast.error("Enter a destination"); return; }
                        setStep("confirm");
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                    >
                      Review Withdrawal <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}

                {step === "confirm" && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="space-y-2.5 rounded-xl border border-border bg-secondary/50 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Method</span>
                        <span className="font-medium text-foreground capitalize">{method === "wallet" ? "External Wallet" : "Bank Transfer"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-semibold text-foreground">${numAmount.toFixed(2)} {token}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fee</span>
                        <span className="text-foreground">${fee.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">You receive</span>
                        <span className="font-bold text-primary">${(numAmount - fee).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">To</span>
                        <span className="truncate max-w-[200px] text-foreground">{address}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setStep("form")} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary">
                        Back
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={processing}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-70"
                      >
                        {processing ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent" />
                        ) : (
                          "Confirm Withdrawal"
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === "done" && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-display text-lg text-foreground">Withdrawal Initiated!</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      ${(numAmount - fee).toFixed(2)} {token} is on its way to your {method === "wallet" ? "wallet" : "bank account"}.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Estimated arrival: {method === "wallet" ? "~2 minutes" : "1-3 business days"}</p>
                    <button onClick={handleClose} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

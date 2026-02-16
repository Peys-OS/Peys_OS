import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Copy, QrCode, Check } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";

type Token = "USDC" | "USDT";

export default function SendPaymentForm() {
  const { isLoggedIn, login, wallet } = useApp();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Token>("USDC");
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [linkCopied, setLinkCopied] = useState(false);

  const generatedLink = `peydot.app/claim/${Math.random().toString(36).slice(2, 10)}`;

  const handleSend = () => {
    if (!isLoggedIn) {
      login();
      return;
    }
    if (step === "form") {
      setStep("confirm");
    } else if (step === "confirm") {
      setStep("done");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${generatedLink}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const balance = token === "USDC" ? wallet.balanceUSDC : wallet.balanceUSDT;

  return (
    <div className="mx-auto max-w-md px-4 pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-card p-6 shadow-card"
      >
        <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
          Send Payment
        </h2>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Token selector */}
              <div className="flex gap-2">
                {(["USDC", "USDT"] as Token[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setToken(t)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      token === t
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {isLoggedIn && (
                <p className="text-xs text-muted-foreground">
                  Balance: {balance.toFixed(2)} {token}
                </p>
              )}

              {/* Amount */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-muted py-4 pl-10 pr-4 text-3xl font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Recipient */}
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Email or phone (optional — creates link)"
                className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {/* Memo */}
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <button
                onClick={handleSend}
                disabled={!amount || Number(amount) <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3.5 font-display font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
                {isLoggedIn ? "Review Payment" : "Sign In to Send"}
              </button>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="rounded-xl bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-foreground">
                    {Number(amount).toFixed(2)} {token}
                  </span>
                </div>
                {recipient && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">To</span>
                    <span className="text-foreground">{recipient}</span>
                  </div>
                )}
                {memo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Note</span>
                    <span className="text-foreground">{memo}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="text-foreground">7 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network fee</span>
                  <span className="text-primary font-medium">~$0.01</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 rounded-xl bg-gradient-primary py-3 font-display font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
                >
                  Confirm & Send
                </button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Payment Created!
              </h3>
              <p className="text-sm text-muted-foreground">
                {Number(amount).toFixed(2)} {token} deposited into escrow.
                Share the link below.
              </p>

              <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
                <span className="flex-1 truncate text-sm text-foreground">
                  {generatedLink}
                </span>
                <button
                  onClick={copyLink}
                  className="rounded-lg bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  {linkCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </button>
                <button className="rounded-lg bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-secondary/80">
                  <QrCode className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setStep("form");
                  setAmount("");
                  setRecipient("");
                  setMemo("");
                }}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary"
              >
                Send Another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

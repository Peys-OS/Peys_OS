import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, ArrowDown, Check, ExternalLink } from "lucide-react";
import { useParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";

export default function ClaimPage() {
  const { id } = useParams();
  const { isLoggedIn, login } = useApp();
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Mock claim data
  const claimData = {
    sender: "Moses A.",
    amount: 50,
    token: "USDC" as const,
    memo: "Thanks for the help! 🙏",
    expiresIn: "6 days",
  };

  const handleClaim = () => {
    if (!isLoggedIn) {
      login();
      return;
    }
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      setClaimed(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader />
      <div className="flex min-h-screen items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {!claimed ? (
            <div className="overflow-hidden rounded-2xl bg-gradient-card shadow-card">
              {/* Top visual */}
              <div className="relative flex flex-col items-center bg-primary/5 px-6 py-8">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow"
                >
                  <Gift className="h-8 w-8 text-primary-foreground" />
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  {claimData.sender} sent you
                </p>
                <h2 className="mt-1 font-display text-4xl font-bold text-foreground">
                  {claimData.amount}{" "}
                  <span className="text-gradient">{claimData.token}</span>
                </h2>
              </div>

              {/* Details */}
              <div className="space-y-4 px-6 py-6">
                {claimData.memo && (
                  <div className="rounded-xl bg-muted p-3 text-center text-sm text-foreground">
                    "{claimData.memo}"
                  </div>
                )}

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Expires in {claimData.expiresIn}</span>
                  <span>Claim ID: {id}</span>
                </div>

                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3.5 font-display font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-70"
                >
                  {claiming ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent"
                    />
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4" />
                      {isLoggedIn ? "Claim Funds" : "Sign In & Claim"}
                    </>
                  )}
                </button>

                {!isLoggedIn && (
                  <p className="text-center text-xs text-muted-foreground">
                    Sign in with email or Google — a wallet is created automatically.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden rounded-2xl bg-gradient-card p-8 text-center shadow-card"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"
              >
                <Check className="h-8 w-8 text-primary" />
              </motion.div>
              <h2 className="mb-2 font-display text-2xl font-bold text-foreground">
                Claimed!
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                {claimData.amount} {claimData.token} is now in your wallet.
              </p>
              <div className="space-y-2">
                <a
                  href="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-display font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  View Dashboard
                </a>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-secondary-foreground transition-colors hover:bg-secondary">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Withdraw / Off-ramp
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

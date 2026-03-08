import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, ArrowDown, Check, ExternalLink } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

export default function ClaimPage() {
  const { id } = useParams();
  const { isLoggedIn, login } = useApp();
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const claimData = {
    sender: "Moses A.",
    amount: 50,
    token: "USDC" as const,
    memo: "Thanks for the help! 🙏",
    expiresIn: "6 days",
  };

  const handleClaim = () => {
    if (!isLoggedIn) { login(); return; }
    setClaiming(true);
    setTimeout(() => { setClaiming(false); setClaimed(true); }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex min-h-[80vh] items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {!claimed ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
              <div className="relative flex flex-col items-center bg-gradient-hero px-6 py-10">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-glow"
                >
                  <Gift className="h-8 w-8 text-primary-foreground" />
                </motion.div>
                <p className="text-sm text-muted-foreground">{claimData.sender} sent you</p>
                <h2 className="mt-1 font-display text-4xl text-foreground">
                  {claimData.amount} <span className="text-gradient">{claimData.token}</span>
                </h2>
              </div>
              <div className="space-y-4 p-6">
                {claimData.memo && (
                  <div className="rounded-xl border border-border bg-secondary/50 p-3 text-center text-sm text-foreground">
                    "{claimData.memo}"
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Expires in {claimData.expiresIn}</span>
                  <span>ID: {id}</span>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-70"
                >
                  {claiming ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <><ArrowDown className="h-4 w-4" />{isLoggedIn ? "Claim Funds" : "Sign In & Claim"}</>
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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center shadow-elevated"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
              >
                <Check className="h-8 w-8 text-primary" />
              </motion.div>
              <h2 className="mb-2 font-display text-2xl text-foreground">Claimed!</h2>
              <p className="mb-6 text-sm text-muted-foreground">{claimData.amount} {claimData.token} is now in your wallet.</p>
              <div className="space-y-2">
                <Link to="/dashboard" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  View Dashboard
                </Link>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-foreground transition-colors hover:bg-secondary">
                  <ExternalLink className="h-3.5 w-3.5" /> Withdraw / Off-ramp
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

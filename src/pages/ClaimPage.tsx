import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, ArrowDown, Check, ExternalLink, Share2 } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { fireConfetti } from "@/lib/confetti";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

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
    setTimeout(() => {
      setClaiming(false);
      setClaimed(true);
      fireConfetti();
    }, 2000);
  };

  const sharePayment = async () => {
    const shareData = {
      title: `${claimData.sender} sent you ${claimData.amount} ${claimData.token} on Pey`,
      text: `Claim your ${claimData.amount} ${claimData.token} payment from ${claimData.sender}! ${claimData.memo || ""}`,
      url: `https://pey.app/claim/${id}`,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard.writeText(shareData.url);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex min-h-[80vh] items-center justify-center px-4 pt-16 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {!claimed ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-elevated sm:rounded-2xl">
              {/* Top brand bar */}
              <div className="h-1.5 w-full bg-primary" />
              
              <div className="relative flex flex-col items-center bg-gradient-hero px-4 py-8 sm:px-6 sm:py-10">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-glow sm:mb-4 sm:h-16 sm:w-16"
                >
                  <Gift className="h-7 w-7 text-primary-foreground sm:h-8 sm:w-8" />
                </motion.div>
                <p className="text-sm text-muted-foreground">{claimData.sender} sent you</p>
                <h2 className="mt-1 font-display text-3xl text-foreground sm:text-4xl">
                  ${claimData.amount.toFixed(2)} <span className="text-gradient">{claimData.token}</span>
                </h2>
              </div>
              <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                {claimData.memo && (
                  <div className="rounded-lg border border-border bg-secondary/50 p-3 text-center text-sm text-foreground sm:rounded-xl">
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
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-70 sm:rounded-xl sm:py-3.5"
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
              className="overflow-hidden rounded-xl border border-border bg-card p-6 text-center shadow-elevated sm:rounded-2xl sm:p-8"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 sm:h-16 sm:w-16"
              >
                <Check className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
              </motion.div>
              <h2 className="mb-2 font-display text-xl text-foreground sm:text-2xl">Claimed! 🎉</h2>
              <p className="mb-5 text-sm text-muted-foreground sm:mb-6">{claimData.amount} {claimData.token} is now in your wallet.</p>
              <div className="space-y-2">
                <Link to="/dashboard" className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:rounded-xl sm:py-3">
                  View Dashboard
                </Link>
                <div className="flex gap-2">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm text-foreground transition-colors hover:bg-secondary sm:rounded-xl sm:py-3">
                    <ExternalLink className="h-3.5 w-3.5" /> Withdraw
                  </button>
                  <button onClick={sharePayment} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm text-foreground transition-colors hover:bg-secondary sm:rounded-xl sm:py-3">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

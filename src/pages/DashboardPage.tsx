import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Clock, Copy, ExternalLink, Send } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import type { Transaction } from "@/hooks/useMockData";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

function formatTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function TxIcon({ type }: { type: Transaction["type"] }) {
  if (type === "sent") return <ArrowUpRight className="h-4 w-4" />;
  if (type === "claimed") return <ArrowDownLeft className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

export default function DashboardPage() {
  const { isLoggedIn, login, wallet, transactions } = useApp();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h2 className="mb-3 font-display text-3xl text-foreground">Sign in to view your dashboard</h2>
            <p className="mb-6 text-muted-foreground">Track payments, view balances, and manage your wallet.</p>
            <button onClick={login} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const badgeStyles = {
    sent: "bg-destructive/10 text-destructive",
    claimed: "bg-primary/10 text-primary",
    pending: "bg-warning/10 text-warning",
  };

  const iconBg = {
    sent: "bg-destructive/10 text-destructive",
    claimed: "bg-primary/10 text-primary",
    pending: "bg-warning/10 text-warning",
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        {/* Wallet Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Overall Balance</p>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {wallet.address}
              <Copy className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors" />
            </span>
          </div>
          <h2 className="mt-1 font-display text-4xl text-foreground">
            ${(wallet.balanceUSDC + wallet.balanceUSDT).toLocaleString("en", { minimumFractionDigits: 2 })}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">All balances in USDC · 1 USDC = 1 USD</p>

          <div className="mt-5 flex gap-3">
            <div className="flex-1 rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground">USDC</p>
              <p className="mt-1 text-lg font-semibold text-foreground">${wallet.balanceUSDC.toFixed(2)}</p>
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">4.2% APY</span>
            </div>
            <div className="flex-1 rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground">USDT</p>
              <p className="mt-1 text-lg font-semibold text-foreground">${wallet.balanceUSDT.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Link to="/send" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              <Send className="h-4 w-4" /> Send
            </Link>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
              <ExternalLink className="h-4 w-4" /> Withdraw
            </button>
          </div>
        </motion.div>

        {/* Yield teaser */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="mb-6 rounded-xl border border-primary/20 bg-gradient-card-hover p-4"
        >
          <p className="text-sm font-medium text-foreground">💡 Earn yield on idle funds</p>
          <p className="mt-1 text-xs text-muted-foreground">Coming soon: Escrowed stables earn yield via Bifrost LSTs on Polkadot.</p>
        </motion.div>

        {/* Transactions */}
        <h3 className="mb-3 font-display text-xl text-foreground">Recent Activity</h3>
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <motion.div key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${iconBg[tx.type]}`}>
                <TxIcon type={tx.type} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{tx.counterparty}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badgeStyles[tx.type]}`}>{tx.type}</span>
                </div>
                <p className="text-xs text-muted-foreground">{tx.memo || formatTime(tx.timestamp)}</p>
              </div>
              <p className={`text-sm font-semibold ${tx.type === "claimed" ? "text-primary" : "text-foreground"}`}>
                {tx.type === "claimed" ? "+" : "-"}{tx.amount} {tx.token}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

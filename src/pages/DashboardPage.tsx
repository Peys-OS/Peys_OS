import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Clock, Copy, ExternalLink } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import type { Transaction } from "@/hooks/useMockData";
import AppHeader from "@/components/AppHeader";

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

function TxBadge({ type }: { type: Transaction["type"] }) {
  const styles = {
    sent: "bg-destructive/10 text-destructive",
    claimed: "bg-primary/10 text-primary",
    pending: "bg-warning/10 text-warning",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[type]}`}>
      {type}
    </span>
  );
}

export default function DashboardPage() {
  const { isLoggedIn, login, wallet, transactions } = useApp();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <AppHeader />
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="mb-3 font-display text-2xl font-bold text-foreground">
              Sign in to view your dashboard
            </h2>
            <p className="mb-6 text-muted-foreground">
              Track payments, view balances, and manage your wallet.
            </p>
            <button
              onClick={login}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-display font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
            >
              Sign In
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader />
      <div className="container mx-auto max-w-lg px-4 pt-24 pb-12">
        {/* Wallet card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-2xl bg-gradient-card p-6 shadow-card"
        >
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {wallet.address}
              <Copy className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors" />
            </span>
          </div>
          <h2 className="mb-4 font-display text-4xl font-bold text-foreground">
            ${(wallet.balanceUSDC + wallet.balanceUSDT).toLocaleString("en", { minimumFractionDigits: 2 })}
          </h2>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">USDC</p>
              <p className="font-display font-semibold text-foreground">
                ${wallet.balanceUSDC.toFixed(2)}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">USDT</p>
              <p className="font-display font-semibold text-foreground">
                ${wallet.balanceUSDT.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <div className="mb-6 flex gap-2">
          <a
            href="/send"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-display text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
          >
            <ArrowUpRight className="h-4 w-4" /> Send
          </a>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
            <ExternalLink className="h-4 w-4" /> Withdraw
          </button>
        </div>

        {/* Yield tease */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <p className="text-sm text-foreground font-medium">
            💡 Earn yield on idle funds
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Coming soon: Escrowed stables earn yield via Bifrost LSTs on Polkadot.
          </p>
        </motion.div>

        {/* Transactions */}
        <h3 className="mb-3 font-display text-lg font-bold text-foreground">
          Recent Activity
        </h3>
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-center gap-3 rounded-xl bg-gradient-card p-4 shadow-card"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  tx.type === "sent"
                    ? "bg-destructive/10 text-destructive"
                    : tx.type === "claimed"
                    ? "bg-primary/10 text-primary"
                    : "bg-warning/10 text-warning"
                }`}
              >
                <TxIcon type={tx.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {tx.counterparty}
                  </p>
                  <TxBadge type={tx.type} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {tx.memo || formatTime(tx.timestamp)}
                </p>
              </div>
              <p
                className={`font-display font-semibold ${
                  tx.type === "claimed" ? "text-primary" : "text-foreground"
                }`}
              >
                {tx.type === "claimed" ? "+" : "-"}
                {tx.amount} {tx.token}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

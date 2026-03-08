import { motion } from "framer-motion";

interface PaymentCardProps {
  sender: string;
  amount: number;
  token: "USDC" | "USDT";
  memo?: string;
  claimId: string;
}

export default function PaymentCard({ sender, amount, token, memo, claimId }: PaymentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
    >
      {/* Top gradient bar */}
      <div className="h-1.5 w-full bg-primary" />

      <div className="p-6 sm:p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <img src="/peys_logo_alone.png" alt="Peys" className="h-10 w-10 rounded-lg" />
          <span className="text-sm font-semibold text-foreground">Peys</span>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Payment Link
          </span>
        </div>

        {/* Amount */}
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground">{sender} sent</p>
          <h2 className="mt-1 font-display text-4xl text-foreground sm:text-5xl">
            ${amount.toFixed(2)}
          </h2>
          <p className="mt-1 text-sm font-medium text-primary">{token}</p>
        </div>

        {/* Memo */}
        {memo && (
          <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-3 text-center">
            <p className="text-sm text-foreground">"{memo}"</p>
          </div>
        )}

        {/* Claim CTA */}
        <div className="rounded-xl bg-primary p-4 text-center">
          <p className="text-sm font-semibold text-primary-foreground">Tap to claim your funds</p>
          <p className="mt-1 text-xs text-primary-foreground/70">peys.app/claim/{claimId}</p>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Secured by escrow</span>
          <span>Built on Polkadot</span>
        </div>
      </div>
    </motion.div>
  );
}

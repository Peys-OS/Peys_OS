import { motion } from "framer-motion";
import {
  Link2, Shield, Globe, Zap, Users, FileText,
  BarChart3, QrCode, Repeat, Wallet, ArrowLeftRight, Bot,
} from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Magic Claim Links",
    desc: "Send money via a simple link. No wallet needed — recipients claim with email.",
    animation: "bounce" as const,
  },
  {
    icon: Shield,
    title: "Smart Contract Escrow",
    desc: "Funds are locked in audited contracts until claimed or auto-refunded.",
    animation: "pulse" as const,
  },
  {
    icon: Globe,
    title: "Global Payments",
    desc: "Send USDC & USDT anywhere on Polkadot with near-zero fees.",
    animation: "spin" as const,
  },
  {
    icon: Zap,
    title: "Payment Streaming",
    desc: "Stream payments per second, minute, or hour. Perfect for salaries.",
    animation: "shake" as const,
  },
  {
    icon: Users,
    title: "Batch Payments",
    desc: "Pay multiple recipients at once via CSV upload. One click, done.",
    animation: "bounce" as const,
  },
  {
    icon: FileText,
    title: "Invoice & Request",
    desc: "Create payment requests with shareable links. Get paid faster.",
    animation: "pulse" as const,
  },
  {
    icon: QrCode,
    title: "QR Code Sharing",
    desc: "Generate branded QR codes for any payment link. Download as PNG.",
    animation: "shake" as const,
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Track volume, claim rates, and geographic distribution live.",
    animation: "bounce" as const,
  },
  {
    icon: Bot,
    title: "AI Assistant",
    desc: "Natural language payments — just say 'Send $50 USDC to alice@email.com'.",
    animation: "pulse" as const,
  },
  {
    icon: ArrowLeftRight,
    title: "Cross-Chain XCM",
    desc: "Transfer stablecoins across Polkadot parachains seamlessly.",
    animation: "spin" as const,
  },
  {
    icon: Wallet,
    title: "Auto Wallets",
    desc: "Recipients get an embedded wallet created automatically on sign-in.",
    animation: "shake" as const,
  },
  {
    icon: Repeat,
    title: "Auto-Refund",
    desc: "Unclaimed payments refund automatically after 7 days. Zero risk.",
    animation: "bounce" as const,
  },
];

const iconAnimations = {
  bounce: {
    y: [0, -4, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
  spin: {
    rotate: [0, 360],
    transition: { duration: 8, repeat: Infinity, ease: "linear" },
  },
  shake: {
    x: [0, -2, 2, -2, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

export default function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Features</p>
          <h2 className="mt-3 font-display text-2xl text-foreground sm:text-4xl md:text-5xl">
            Everything you need to move money
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            A complete payment toolkit — from one-click sends to streaming salaries.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:mt-20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="group bg-card p-6 transition-colors hover:bg-secondary/30 sm:p-8"
              >
                <motion.div
                  animate={iconAnimations[f.animation]}
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors group-hover:text-foreground"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

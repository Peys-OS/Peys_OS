import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

const features = [
  {
    icon: Zap,
    title: "Magic Claim Links",
    desc: "Send money to anyone — no wallet needed. They claim with just an email.",
  },
  {
    icon: Shield,
    title: "Secure Escrow",
    desc: "Funds held in audited smart contracts until claimed or auto-refunded.",
  },
  {
    icon: Globe,
    title: "Polkadot Powered",
    desc: "Low fees, fast finality, and stablecoin support via Polkadot Hub.",
  },
];

export default function HeroSection() {
  const { isLoggedIn } = useApp();

  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 text-center">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-2xl"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Polkadot Hackathon — EVM Track
        </div>

        <h1 className="mb-4 font-display text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Pay anyone,{" "}
          <span className="text-gradient">anywhere</span>
        </h1>

        <p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
          Send stablecoins with a link. Recipients claim with just an email — no crypto experience required.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to={isLoggedIn ? "/send" : "/send"}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-display font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
          >
            Send Payment <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/claim/demo"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-6 py-3 font-display font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Try Claiming
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="relative z-10 mt-20 grid w-full max-w-3xl gap-4 sm:grid-cols-3"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.15 }}
            className="rounded-xl bg-gradient-card p-5 shadow-card"
          >
            <f.icon className="mb-3 h-6 w-6 text-primary" />
            <h3 className="mb-1 font-display font-semibold text-foreground">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

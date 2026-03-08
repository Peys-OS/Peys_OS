import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import dashboardPreview from "@/assets/dashboard-preview.png";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero pt-24 pb-12 sm:pt-32 sm:pb-16">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mx-auto max-w-3xl font-display text-3xl leading-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Better payments with{" "}
            <span className="text-gradient">stablecoin</span>
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:mt-6 sm:text-lg">
            Send stablecoins to anyone with a magic link. No wallet needed — just email. Built on Polkadot.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center">
            <Link
              to="/send"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 sm:w-auto"
            >
              Send Payment <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/claim/demo"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:w-auto"
            >
              Try Claiming
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground sm:mt-6">
            Built for the Polkadot Solidity Hackathon — EVM Track
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mt-10 max-w-4xl sm:mt-16"
        >
          <div className="overflow-hidden rounded-xl border border-border shadow-elevated sm:rounded-2xl">
            <img
              src={dashboardPreview}
              alt="Pey Dashboard showing stablecoin balances and transactions"
              className="w-full"
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

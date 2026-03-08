import { motion } from "framer-motion";
import { Link2, Shield, Globe, Zap, Users, BarChart3 } from "lucide-react";

import featureMagicLinks from "@/assets/feature-magic-links.png";
import featureEscrow from "@/assets/feature-escrow.png";
import featureGlobal from "@/assets/feature-global.png";
import featureStreaming from "@/assets/feature-streaming.png";
import featureBatch from "@/assets/feature-batch.png";
import featureAnalytics from "@/assets/feature-analytics.png";

const features = [
  {
    icon: Link2,
    title: "Magic Claim Links",
    desc: "Send money via a simple link. No wallet needed — recipients sign in with email and funds appear instantly in their account.",
    image: featureMagicLinks,
    alt: "Magic link payment illustration",
  },
  {
    icon: Shield,
    title: "Smart Contract Escrow",
    desc: "Funds are locked in audited smart contracts on Polkadot until claimed. If unclaimed after 7 days, they're automatically refunded.",
    image: featureEscrow,
    alt: "Security shield escrow illustration",
  },
  {
    icon: Globe,
    title: "Global Payments",
    desc: "Send USDC and USDT to anyone in the world on Polkadot Asset Hub with near-zero gas fees. No borders, no limits.",
    image: featureGlobal,
    alt: "Global payments illustration",
  },
  {
    icon: Zap,
    title: "Payment Streaming",
    desc: "Stream payments per second, minute, or hour. Ideal for salaries, subscriptions, and any recurring transfer that needs real-time flow.",
    image: featureStreaming,
    alt: "Payment streaming illustration",
  },
  {
    icon: Users,
    title: "Batch Payments",
    desc: "Upload a CSV and pay hundreds of recipients in one click. Perfect for payroll, airdrops, and bulk distributions.",
    image: featureBatch,
    alt: "Batch payments illustration",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Track your payment volume, claim rates, geographic reach, and top recipients — all updated live in a beautiful dashboard.",
    image: featureAnalytics,
    alt: "Analytics dashboard illustration",
  },
];

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

        <div className="mx-auto mt-16 max-w-5xl space-y-12 sm:mt-24 sm:space-y-20">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isReversed = i % 2 === 1;

            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`flex flex-col items-center gap-8 sm:gap-12 md:flex-row ${
                  isReversed ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Image */}
                <div className="flex w-full items-center justify-center md:w-1/2">
                  <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card sm:max-w-sm sm:p-8">
                    <img
                      src={f.image}
                      alt={f.alt}
                      className="h-auto w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Text */}
                <div className="w-full text-center md:w-1/2 md:text-left">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary text-primary sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-xl text-foreground sm:text-2xl">{f.title}</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

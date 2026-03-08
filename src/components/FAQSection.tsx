import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What is Pey?",
    a: "Pey is a peer-to-peer stablecoin payments app built on Polkadot. Send USDC or USDT to anyone via a shareable link — no wallet or crypto knowledge required.",
  },
  {
    q: "How do Magic Claim Links work?",
    a: "When you send a payment, funds are deposited into a secure escrow smart contract and a unique link is generated. The recipient clicks the link, signs in with their email, and claims the funds to an automatically-created wallet.",
  },
  {
    q: "Does the recipient need a crypto wallet?",
    a: "No! When the recipient clicks the claim link and signs in (via email or Google), an embedded wallet is automatically created for them. Zero crypto experience needed.",
  },
  {
    q: "What happens if the recipient doesn't claim?",
    a: "Unclaimed payments are automatically refunded to the sender after 7 days. Your funds are never at risk.",
  },
  {
    q: "Which stablecoins are supported?",
    a: "Pey supports USDC (asset ID 1337) and USDT (asset ID 1984) on Polkadot Asset Hub, transferred via XCM precompiles.",
  },
  {
    q: "What are the fees?",
    a: "Transaction fees on Polkadot Hub are minimal — typically less than $0.01. Pey itself does not charge additional fees during the hackathon period.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-2xl text-foreground sm:text-4xl">
            Your questions, answered
          </h2>
        </motion.div>

        <div className="mt-8 space-y-2 sm:mt-12 sm:space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-lg border border-border bg-card sm:rounded-xl"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-6 sm:py-4"
              >
                <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="px-4 pb-3 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:pb-4">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

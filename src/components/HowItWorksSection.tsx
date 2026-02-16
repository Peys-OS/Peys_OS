import { motion } from "framer-motion";
import claimMockup from "@/assets/claim-phone-mockup.png";

const steps = [
  { num: "01", title: "Choose amount & token", desc: "Select USDC or USDT and enter the amount. Add an optional note for the recipient." },
  { num: "02", title: "Generate a magic link", desc: "A unique claim link is created and funds are deposited into secure escrow." },
  { num: "03", title: "Share via text, email, or QR", desc: "Copy the link or share a QR code — the recipient doesn't need any crypto knowledge." },
  { num: "04", title: "Recipient claims instantly", desc: "They sign in with email or Google. A wallet is created automatically. One tap to claim." },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left: Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-primary/5 blur-3xl" />
              <img
                src={claimMockup}
                alt="PeyDot claim flow on mobile phone"
                className="relative z-10 h-[450px] object-contain animate-float"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Right: Steps */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-4xl text-foreground sm:text-5xl">
                How it works
              </h2>
              <p className="mt-4 text-muted-foreground">
                From send to claim — in under 60 seconds.
              </p>
            </motion.div>

            <div className="mt-10 space-y-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground">
                    {step.num}
                  </span>
                  <div>
                    <h4 className="font-semibold text-foreground">{step.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

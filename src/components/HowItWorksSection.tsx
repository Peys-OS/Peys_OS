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
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Phone Mockup - hidden on small mobile, shown on sm+ */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden justify-center sm:flex"
          >
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-primary/5 blur-3xl" />
              <img
                src={claimMockup}
                alt="Pey claim flow on mobile phone"
                className="relative z-10 h-[320px] object-contain animate-float sm:h-[400px] lg:h-[450px]"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Steps */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-2xl text-foreground sm:text-4xl md:text-5xl">
                How it works
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
                From send to claim — in under 60 seconds.
              </p>
            </motion.div>

            <div className="mt-8 space-y-4 sm:mt-10 sm:space-y-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-3 sm:gap-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm">
                    {step.num}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground sm:text-base">{step.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{step.desc}</p>
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

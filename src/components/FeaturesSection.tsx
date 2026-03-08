import { motion } from "framer-motion";
import magicLinkImg from "@/assets/magic-link-illustration.png";
import securityImg from "@/assets/security-illustration.png";
import globalImg from "@/assets/global-illustration.png";

const features = [
  {
    title: "Magic Claim Links",
    desc: "Send money to anyone — no wallet needed. They claim with just an email or social login. Funds held securely in escrow.",
    img: magicLinkImg,
    tag: "Core Feature",
  },
  {
    title: "Secure Escrow",
    desc: "Funds are held in audited smart contracts until claimed or auto-refunded after expiry. Non-custodial by design.",
    img: securityImg,
    tag: "Security",
  },
  {
    title: "Global by Default",
    desc: "Powered by Polkadot Hub with USDC & USDT support. Low fees, fast finality, and cross-chain transfers via XCM.",
    img: globalImg,
    tag: "Infrastructure",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-gradient-section py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-2xl text-foreground sm:text-4xl md:text-5xl">
            All your stablecoin workflow<br className="hidden sm:block" />
            without any complexity
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Simple, fast, and secure payments — designed for everyone from Lagos to Tokyo.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:mt-16 sm:gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group overflow-hidden rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-card hover:bg-gradient-card-hover sm:rounded-2xl sm:p-6"
            >
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {f.tag}
              </span>
              <div className="my-4 flex justify-center sm:my-6">
                <img
                  src={f.img}
                  alt={f.title}
                  className="h-32 w-32 object-contain transition-transform group-hover:scale-105 sm:h-40 sm:w-40"
                  loading="lazy"
                />
              </div>
              <h3 className="font-display text-lg text-foreground sm:text-xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

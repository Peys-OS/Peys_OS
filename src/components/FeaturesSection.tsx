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
    <section className="bg-gradient-section py-24">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-4xl text-foreground sm:text-5xl">
            All your stablecoin workflow<br />
            without any complexity
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Simple, fast, and secure payments — designed for everyone from Lagos to Tokyo.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-card hover:bg-gradient-card-hover"
            >
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {f.tag}
              </span>
              <div className="my-6 flex justify-center">
                <img
                  src={f.img}
                  alt={f.title}
                  className="h-40 w-40 object-contain transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <h3 className="font-display text-xl text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";

const stats = [
  { value: "$2.4M+", label: "Test volume processed" },
  { value: "12K+", label: "Magic links generated" },
  { value: "<$0.01", label: "Average transaction fee" },
  { value: "45+", label: "Countries supported" },
];

const testimonials = [
  {
    quote: "Pey made it effortless to send stablecoins to my family in Lagos. They just clicked a link and claimed — no crypto headaches.",
    name: "Adaeze O.",
    role: "Freelancer, Nigeria",
  },
  {
    quote: "We use Pey to pay our remote contractors globally. The magic link flow means we don't have to teach them about wallets.",
    name: "Kenji M.",
    role: "Startup Founder, Tokyo",
  },
  {
    quote: "The escrow system gives me confidence that funds are safe. If they don't claim, I get my money back automatically.",
    name: "Sarah L.",
    role: "Digital Nomad, Berlin",
  },
];

export default function SocialProofSection() {
  return (
    <section className="bg-gradient-section py-24">
      <div className="container mx-auto">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl text-foreground sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-4xl text-foreground">
            Trusted by users worldwide
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <p className="text-sm leading-relaxed text-foreground">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

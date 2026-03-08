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
    <section className="bg-gradient-section py-16 sm:py-24">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 grid grid-cols-2 gap-6 sm:mb-20 sm:gap-8 md:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-2xl text-foreground sm:text-3xl md:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
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
          <h2 className="font-display text-2xl text-foreground sm:text-4xl">
            Trusted by users worldwide
          </h2>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5 shadow-soft sm:rounded-2xl sm:p-6"
            >
              <p className="text-sm leading-relaxed text-foreground">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-10 sm:w-10 sm:text-sm">
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

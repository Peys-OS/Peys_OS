import { motion } from "framer-motion";
import { Code, Terminal, Box, Globe, ArrowRight, Lock } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

const features = [
  {
    icon: Globe,
    title: "REST API",
    description: "Full programmatic access to all payment features. Send, receive, and manage payments via simple HTTP requests."
  },
  {
    icon: Terminal,
    title: "SDKs",
    description: "Official SDKs for JavaScript, Python, Go, and more. Integrate payments in minutes, not days."
  },
  {
    icon: Box,
    title: "Widgets",
    description: "Embed payment buttons and forms directly in your website. Customizable to match your brand."
  },
  {
    icon: Lock,
    title: "Webhooks",
    description: "Real-time event notifications for payments, claims, and refunds. Stay in sync with your systems."
  }
];

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main>
        <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-24">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-center"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
                <Code className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Coming Soon</span>
              </div>
              <h1 className="font-display text-4xl text-foreground sm:text-5xl md:text-6xl">
                Build with Peys.<br />Integrate payments everywhere.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                Powerful APIs and SDKs to integrate USDC payments into your apps, platforms, and workflows.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-border py-20 sm:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                Developer Tools
              </h2>
              <p className="mt-4 text-muted-foreground">
                Everything you need to build payment flows into your products
              </p>
            </motion.div>

            <div className="mt-12 mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border border-border bg-card p-6"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-xl text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/30 py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl"
            >
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">
                Get Early Access
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join the developer preview program to get early access to our APIs and SDKs.
              </p>
              <div className="mt-8">
                <a
                  href="mailto:developers@peys.io"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                >
                  Request Access <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

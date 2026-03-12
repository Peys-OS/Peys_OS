import { Link } from "react-router-dom";
import { ArrowRight, Code, Globe, Box, Terminal, Shield, Zap, CreditCard, Key, Clock, CheckCircle } from "lucide-react";
import DocsLayout from "@/components/DocsLayout";

export default function DocsPage() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <div className="mb-8">
          <Link to="/developers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Developers
          </Link>
          <h1 className="text-4xl font-bold text-foreground">Peys Developer Documentation</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Build powerful payment flows into your products with our comprehensive APIs and SDKs.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {[
            { icon: Zap, title: "Quick Start", desc: "Get started in minutes", to: "/docs/quickstart" },
            { icon: Code, title: "SDKs", desc: "Official libraries for popular languages", to: "/docs/sdks/javascript" },
            { icon: Globe, title: "REST API", desc: "Full programmatic access", to: "/docs/api/payments" },
            { icon: Box, title: "Widgets", desc: "Embed payment UI in your site", to: "/docs/widgets/overview" },
            { icon: Terminal, title: "Webhooks", desc: "Real-time event notifications", to: "/docs/webhooks" },
            { icon: Shield, title: "Security", desc: "Enterprise-grade security", to: "/docs/api/authentication" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.to}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-secondary/50"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </Link>
            );
          })}
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">Why Developers Choose Peys</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Zap, title: "Fast Integration", desc: "Get started in minutes, not days. Our APIs are designed to be intuitive and developer-friendly." },
              { icon: Shield, title: "Secure by Default", desc: "Enterprise-grade security with SOC 2 compliance, encryption at rest and in transit, and fraud prevention." },
              { icon: Clock, title: "99.99% Uptime", desc: "Reliable infrastructure with automatic failover and global CDN for fast response times worldwide." },
              { icon: CreditCard, title: "Global Payments", desc: "Accept payments from anywhere in the world with support for 100+ currencies and multiple chains." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">Supported Blockchains</h2>
          <p className="mt-4 text-muted-foreground">
            Peys supports multiple blockchain networks for maximum flexibility:
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Base Sepolia", symbol: "ETH", network: "Testnet" },
              { name: "Celo Alfajores", symbol: "CELO", network: "Testnet" },
              { name: "Polkadot", symbol: "DOT", network: "Testnet" },
              { name: "Ethereum", symbol: "ETH", network: "Mainnet (Coming Soon)" },
              { name: "Polygon", symbol: "MATIC", network: "Mainnet (Coming Soon)" },
              { name: "Solana", symbol: "SOL", network: "Mainnet (Coming Soon)" },
            ].map((chain) => (
              <div key={chain.name} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{chain.name}</p>
                  <p className="text-sm text-muted-foreground">{chain.symbol}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  chain.network.includes("Coming Soon") 
                    ? "bg-secondary text-muted-foreground" 
                    : "bg-green-500/10 text-green-500"
                }`}>
                  {chain.network}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-2 text-muted-foreground">
            Join the developer preview program to get early access to our APIs and SDKs.
          </p>
          <div className="mt-4 flex gap-4">
            <Link
              to="/docs/quickstart"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Quick Start Guide <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:developers@peys.io"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Contact Sales
            </a>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

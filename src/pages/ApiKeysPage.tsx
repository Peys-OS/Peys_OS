import { motion } from "framer-motion";
import { Key, Clock, Mail, ArrowRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ApiKeysPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto max-w-5xl px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Coming Soon</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
            <p className="text-muted-foreground mt-2">
              Generate API keys to integrate the Peys REST API and SDKs into your applications.
            </p>
          </div>

          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Key className="h-8 w-8 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    Developer API Access
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    API keys for the Peys Payment Platform are currently in development. 
                    Get early access to integrate USDC payments into your apps.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:peys.xyz@gmail.com?subject=API Access Request"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                  >
                    <Mail className="h-4 w-4" />
                    Request Early Access
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  
                  <a
                    href="/developers"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    View Developer Options
                  </a>
                </div>

                <div className="pt-8 border-t border-border mt-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    When launched, you'll be able to:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                    {[
                      "Generate API keys with rate limits",
                      "Access REST API endpoints",
                      "Use SDKs (JavaScript, Python, Go)",
                      "Receive webhook notifications",
                      "Monitor API usage & analytics",
                      "Manage multiple API keys",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Pricing Tiers
              </CardTitle>
              <CardDescription>
                Choose the plan that fits your needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "Free", price: "$0/mo", calls: "1,000 API calls/month", features: ["Testnet only", "Community support", "Basic analytics"] },
                  { name: "Pro", price: "$99/mo", calls: "100,000 API calls/month", features: ["Mainnet + Testnet", "Priority support", "Webhooks", "Advanced analytics"] },
                  { name: "Enterprise", price: "Custom", calls: "Unlimited API calls", features: ["Dedicated support", "Custom rate limits", "SLA guarantee", "Account manager"] },
                ].map((tier) => (
                  <div key={tier.name} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{tier.name}</h3>
                      <span className="text-lg font-bold text-primary">{tier.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{tier.calls}</p>
                    <ul className="space-y-1">
                      {tier.features.map((f) => (
                        <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

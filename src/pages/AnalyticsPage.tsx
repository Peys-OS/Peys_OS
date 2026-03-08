import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Globe, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { Link } from "react-router-dom";

const volumeData = [
  { name: "Mon", volume: 1200 },
  { name: "Tue", volume: 1800 },
  { name: "Wed", volume: 2400 },
  { name: "Thu", volume: 1600 },
  { name: "Fri", volume: 3200 },
  { name: "Sat", volume: 2800 },
  { name: "Sun", volume: 2100 },
];

const claimRateData = [
  { name: "Week 1", rate: 72 },
  { name: "Week 2", rate: 78 },
  { name: "Week 3", rate: 85 },
  { name: "Week 4", rate: 82 },
  { name: "Week 5", rate: 89 },
  { name: "Week 6", rate: 91 },
];

const tokenDistribution = [
  { name: "USDC", value: 68, color: "hsl(250, 65%, 52%)" },
  { name: "USDT", value: 32, color: "hsl(155, 70%, 42%)" },
];

const topRecipients = [
  { name: "alice@email.com", amount: 1250, count: 8 },
  { name: "bob@email.com", amount: 890, count: 5 },
  { name: "grace@email.com", amount: 675, count: 12 },
  { name: "moses@email.com", amount: 420, count: 3 },
  { name: "sarah@email.com", amount: 310, count: 6 },
];

const geoData = [
  { country: "🇳🇬 Nigeria", payments: 342, pct: 28 },
  { country: "🇯🇵 Japan", payments: 218, pct: 18 },
  { country: "🇩🇪 Germany", payments: 185, pct: 15 },
  { country: "🇺🇸 United States", payments: 156, pct: 13 },
  { country: "🇧🇷 Brazil", payments: 124, pct: 10 },
  { country: "🌍 Others", payments: 195, pct: 16 },
];

const stats = [
  { label: "Total Volume", value: "$14,200", change: "+23%", icon: TrendingUp },
  { label: "Payments Sent", value: "284", change: "+18%", icon: ArrowUpRight },
  { label: "Claim Rate", value: "89%", change: "+4%", icon: ArrowDownLeft },
  { label: "Avg. Claim Time", value: "2.4h", change: "-12%", icon: Clock },
];

export default function AnalyticsPage() {
  const { isLoggedIn, login } = useApp();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Sign in to view analytics</h2>
            <p className="mb-6 text-sm text-muted-foreground">See your payment volume, claim rates, and more.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="relative container mx-auto max-w-5xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">Analytics</h1>
              <p className="mt-1 text-sm text-muted-foreground">Track your payment performance</p>
            </div>
            <Link to="/dashboard" className="text-sm text-primary hover:underline">← Dashboard</Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 font-display text-xl text-foreground sm:text-2xl">{s.value}</p>
              <p className={`mt-1 text-xs font-medium ${s.change.startsWith("+") ? "text-primary" : "text-destructive"}`}>
                {s.change} vs last period
              </p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="mb-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Volume Chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <h3 className="mb-4 text-sm font-semibold text-foreground">Payment Volume (7d)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`$${value}`, "Volume"]}
                />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Claim Rate */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <h3 className="mb-4 text-sm font-semibold text-foreground">Claim Rate Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={claimRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`${value}%`, "Claim Rate"]}
                />
                <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Token Distribution */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <h3 className="mb-4 text-sm font-semibold text-foreground">Token Split</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={tokenDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none">
                  {tokenDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`${value}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4">
              {tokenDistribution.map((t) => (
                <div key={t.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="text-xs text-muted-foreground">{t.name} {t.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Recipients */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <h3 className="mb-4 text-sm font-semibold text-foreground">Top Recipients</h3>
            <div className="space-y-3">
              {topRecipients.map((r, i) => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.count} payments</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">${r.amount}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Geographic Distribution */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Geographic Reach</h3>
            </div>
            <div className="space-y-3">
              {geoData.map((g) => (
                <div key={g.country}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{g.country}</span>
                    <span className="text-muted-foreground">{g.payments}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${g.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

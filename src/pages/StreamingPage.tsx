import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Plus, Clock, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

type StreamStatus = "active" | "paused" | "completed";
type StreamInterval = "per_second" | "per_minute" | "per_hour" | "per_day";

interface PaymentStream {
  id: string;
  recipient: string;
  totalAmount: number;
  streamedAmount: number;
  token: "USDC" | "USDT";
  interval: StreamInterval;
  ratePerInterval: number;
  status: StreamStatus;
  startedAt: Date;
  memo?: string;
}

const MOCK_STREAMS: PaymentStream[] = [
  {
    id: "s1",
    recipient: "alice@email.com",
    totalAmount: 5000,
    streamedAmount: 2340,
    token: "USDC",
    interval: "per_hour",
    ratePerInterval: 10,
    status: "active",
    startedAt: new Date(Date.now() - 86400000 * 3),
    memo: "Monthly salary",
  },
  {
    id: "s2",
    recipient: "bob@email.com",
    totalAmount: 1000,
    streamedAmount: 1000,
    token: "USDT",
    interval: "per_day",
    ratePerInterval: 100,
    status: "completed",
    startedAt: new Date(Date.now() - 86400000 * 10),
    memo: "Subscription payment",
  },
  {
    id: "s3",
    recipient: "grace@email.com",
    totalAmount: 2500,
    streamedAmount: 800,
    token: "USDC",
    interval: "per_hour",
    ratePerInterval: 5,
    status: "paused",
    startedAt: new Date(Date.now() - 86400000),
    memo: "Freelance retainer",
  },
];

const intervalLabels: Record<StreamInterval, string> = {
  per_second: "/sec",
  per_minute: "/min",
  per_hour: "/hr",
  per_day: "/day",
};

const statusStyles: Record<StreamStatus, string> = {
  active: "bg-primary/10 text-primary",
  paused: "bg-warning/10 text-warning",
  completed: "bg-muted text-muted-foreground",
};

export default function StreamingPage() {
  const { isLoggedIn, login } = useApp();
  const [streams, setStreams] = useState<PaymentStream[]>(MOCK_STREAMS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    recipient: "",
    amount: "",
    token: "USDC" as "USDC" | "USDT",
    interval: "per_hour" as StreamInterval,
    rate: "",
    memo: "",
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Zap className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Payment Streaming</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">Stream payments in real-time. Perfect for salaries, subscriptions, and recurring transfers.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In to Start
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const toggleStream = (id: string) => {
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.status === "completed") return s;
        const newStatus = s.status === "active" ? "paused" : "active";
        toast.success(`Stream ${newStatus === "active" ? "resumed" : "paused"}`);
        return { ...s, status: newStatus };
      })
    );
  };

  const createStream = () => {
    if (!form.recipient || !form.amount || !form.rate) {
      toast.error("Please fill in all required fields");
      return;
    }
    const newStream: PaymentStream = {
      id: `s${Date.now()}`,
      recipient: form.recipient,
      totalAmount: Number(form.amount),
      streamedAmount: 0,
      token: form.token,
      interval: form.interval,
      ratePerInterval: Number(form.rate),
      status: "active",
      startedAt: new Date(),
      memo: form.memo || undefined,
    };
    setStreams((prev) => [newStream, ...prev]);
    setShowCreate(false);
    setForm({ recipient: "", amount: "", token: "USDC", interval: "per_hour", rate: "", memo: "" });
    toast.success("Payment stream created! 🚀");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-2xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">Streams</h1>
              <p className="mt-1 text-sm text-muted-foreground">Real-time payment streaming</p>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New Stream
            </button>
          </div>
        </motion.div>

        {/* Create Stream Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
                <h3 className="mb-4 font-display text-lg text-foreground">Create Stream</h3>
                <div className="space-y-3">
                  <input
                    value={form.recipient}
                    onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                    placeholder="Recipient email"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="Total amount"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex gap-2">
                      {(["USDC", "USDT"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setForm({ ...form, token: t })}
                          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            form.token === t
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={form.rate}
                      onChange={(e) => setForm({ ...form, rate: e.target.value })}
                      placeholder="Rate per interval"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <select
                      value={form.interval}
                      onChange={(e) => setForm({ ...form, interval: e.target.value as StreamInterval })}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="per_second">Per Second</option>
                      <option value="per_minute">Per Minute</option>
                      <option value="per_hour">Per Hour</option>
                      <option value="per_day">Per Day</option>
                    </select>
                  </div>
                  <input
                    value={form.memo}
                    onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    placeholder="Memo (optional)"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                      Cancel
                    </button>
                    <button onClick={createStream} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
                      Start Stream
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stream List */}
        <div className="space-y-3">
          {streams.map((stream, i) => {
            const progress = (stream.streamedAmount / stream.totalAmount) * 100;
            return (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{stream.recipient}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[stream.status]}`}>
                        {stream.status}
                      </span>
                    </div>
                    {stream.memo && <p className="mt-0.5 text-xs text-muted-foreground">{stream.memo}</p>}
                  </div>
                  {stream.status !== "completed" && (
                    <button
                      onClick={() => toggleStream(stream.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {stream.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-end justify-between text-sm">
                  <div>
                    <span className="font-display text-xl text-foreground">${stream.streamedAmount.toLocaleString()}</span>
                    <span className="text-muted-foreground"> / ${stream.totalAmount.toLocaleString()} {stream.token}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ${stream.ratePerInterval}{intervalLabels[stream.interval]}
                  </span>
                </div>

                <div className="mt-2 h-1.5 rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${stream.status === "completed" ? "bg-muted-foreground" : "bg-primary"}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}

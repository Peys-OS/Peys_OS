import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Plus, Clock, ArrowRight, Zap, RefreshCw, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaymentStream {
  id: string;
  user_id: string | null;
  wallet_address: string | null;
  recipient_address: string;
  recipient_email: string | null;
  token: string;
  total_amount: number;
  streamed_amount: number;
  rate_per_second: number;
  status: string;
  started_at: string;
  ends_at: string;
  cancelled_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  paused: "bg-warning/10 text-warning",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function StreamingPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [streams, setStreams] = useState<PaymentStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    recipient: "",
    amount: "",
    token: "USDC" as "USDC" | "USDT",
    rate: "",
    duration: "30",
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchStreams();
    }
  }, [isLoggedIn, walletAddress]);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_streams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching streams:", error);
        setStreams([]);
      } else {
        setStreams(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };

  const createStream = async () => {
    if (!form.recipient || !form.amount) {
      toast.error("Please fill in recipient and amount");
      return;
    }
    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalAmount = Math.round(parseFloat(form.amount) * 1000000);
      const duration = parseInt(form.duration) * 24 * 60 * 60;
      const ratePerSecond = Math.round(totalAmount / duration);

      const { error } = await supabase
        .from("payment_streams")
        .insert({
          user_id: user.id,
          recipient_address: form.recipient.includes('@') ? '' : form.recipient,
          recipient_email: form.recipient.includes('@') ? form.recipient : null,
          token: form.token,
          total_amount: totalAmount,
          streamed_amount: 0,
          rate_per_second: ratePerSecond,
          status: "active",
          started_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + duration * 1000).toISOString(),
          memo: null,
        });

      if (error) {
        console.error("Error creating stream:", error);
        toast.error(`Failed to create stream: ${error.message}`);
        return;
      }

      toast.success("Payment stream created!");
      setShowCreate(false);
      setForm({ recipient: "", amount: "", token: "USDC", rate: "", duration: "30" });
      fetchStreams();
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err?.message || "Failed to create stream");
    } finally {
      setCreating(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Zap className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Streaming Payments</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">Stream payments in real-time. Perfect for salaries, subscriptions, and recurring transfers.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const activeStreams = streams.filter((s) => s.status === "active");
  const totalStreamed = activeStreams.reduce((sum, s) => sum + s.streamed_amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-5xl lg:max-w-6xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-24 lg:pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">Streaming</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading ? "Loading..." : activeStreams.length > 0 
                  ? `${activeStreams.length} active streams • $${totalStreamed.toLocaleString()} streamed`
                  : "No active streams"}
              </p>
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
              <div className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6 lg:p-8">
                <h3 className="mb-4 font-display text-lg text-foreground">Create Payment Stream</h3>
                <div className="space-y-3">
                  <input
                    value={form.recipient}
                    onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                    placeholder="Recipient email or wallet address"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="Total amount"
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <select
                      value={form.token}
                      onChange={(e) => setForm({ ...form, token: e.target.value as "USDC" | "USDT" })}
                      className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={form.rate}
                      onChange={(e) => setForm({ ...form, rate: e.target.value })}
                      placeholder="Rate per second"
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <select
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                      Cancel
                    </button>
                    <button onClick={createStream} disabled={creating} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                      {creating ? "Creating..." : "Create Stream"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streams List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : streams.length > 0 ? (
          <div className="space-y-4 lg:space-y-6">
            {streams.map((stream, i) => (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-4 lg:p-6 transition-colors hover:bg-secondary/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${statusStyles[stream.status]}`}>
                      {stream.status === "active" ? <Play className="h-4 w-4" /> : stream.status === "paused" ? <Pause className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{stream.recipient_email || stream.recipient_address}</p>
                      <p className="text-xs text-muted-foreground">{stream.memo || "No description"}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[stream.status]}`}>
                    {statusLabels[stream.status] || stream.status}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>${stream.streamed_amount.toLocaleString()} / ${stream.total_amount.toLocaleString()} {stream.token}</span>
                    <span>{Math.round((stream.streamed_amount / stream.total_amount) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min((stream.streamed_amount / stream.total_amount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Zap className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No payment streams yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first stream to start streaming payments.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, DollarSign, Users, Pause, Play, Trash2, ArrowLeft, RefreshCw, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly";
type Token = "USDC" | "USDT" | "PASS";

interface RecurringPayment {
  id: string;
  recipient: string;
  recipientName?: string;
  amount: number;
  token: Token;
  frequency: Frequency;
  startDate: Date;
  endDate?: Date;
  occurrences?: number;
  nextPayment: Date;
  status: "active" | "paused" | "completed";
  totalPaid: number;
  totalSent: number;
}

const FREQUENCIES: { value: Frequency; label: string; days: number }[] = [
  { value: "daily", label: "Daily", days: 1 },
  { value: "weekly", label: "Weekly", days: 7 },
  { value: "biweekly", label: "Bi-weekly", days: 14 },
  { value: "monthly", label: "Monthly", days: 30 },
  { value: "quarterly", label: "Quarterly", days: 90 },
];

function getNextPaymentDate(startDate: Date, frequency: Frequency, occurrences: number): Date {
  const freq = FREQUENCIES.find((f) => f.value === frequency)!;
  const next = new Date(startDate);
  next.setDate(next.getDate() + freq.days * (occurrences - 1));
  return next;
}

export default function RecurringPaymentsPage() {
  const { isLoggedIn, login, wallet } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [payments, setPayments] = useState<RecurringPayment[]>([]);

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Token>("USDC");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [hasOccurrences, setHasOccurrences] = useState(true);
  const [occurrences, setOccurrences] = useState("12");
  const [creating, setCreating] = useState(false);

  const getBalance = () => {
    if (token === "USDC") return wallet.balanceUSDC;
    if (token === "USDT") return wallet.balanceUSDT;
    return wallet.balancePASS;
  };

  const handleCreate = async () => {
    if (!recipient || !amount || Number(amount) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const numOccurrences = hasOccurrences ? Number(occurrences) : 999;
    const newPayment: RecurringPayment = {
      id: `recurring_${Date.now()}`,
      recipient,
      recipientName: recipient.includes("@") ? recipient : undefined,
      amount: Number(amount),
      token,
      frequency,
      startDate: new Date(startDate),
      endDate: hasEndDate ? new Date(endDate) : undefined,
      occurrences: hasOccurrences ? Number(occurrences) : undefined,
      nextPayment: getNextPaymentDate(new Date(startDate), frequency, 1),
      status: "active",
      totalPaid: 0,
      totalSent: 0,
    };

    setPayments((prev) => [...prev, newPayment]);
    setCreating(false);
    setShowCreate(false);
    resetForm();
    toast.success("Recurring payment created!");
  };

  const resetForm = () => {
    setRecipient("");
    setAmount("");
    setToken("USDC");
    setFrequency("monthly");
    setStartDate(new Date().toISOString().split("T")[0]);
    setHasEndDate(false);
    setEndDate("");
    setHasOccurrences(true);
    setOccurrences("12");
  };

  const togglePause = (id: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === "active" ? "paused" : "active" } : p
      )
    );
    toast.success("Payment status updated");
  };

  const deletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    toast.success("Recurring payment deleted");
  };

  const formatFrequency = (freq: Frequency) => {
    return FREQUENCIES.find((f) => f.value === freq)?.label || freq;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <RefreshCw className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Recurring Payments</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Set up automatic payments on a schedule. Perfect for subscriptions, allowances, and regular transfers.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Get Started
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-5xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl text-foreground sm:text-4xl">Recurring Payments</h1>
                <p className="text-muted-foreground">Automate your regular payments</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              <DollarSign className="h-4 w-4" />
              New Recurring
            </button>
          </div>
        </motion.div>

        {/* Active Payments */}
        {payments.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <RefreshCw className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 font-display text-lg text-foreground">No recurring payments yet</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Create your first recurring payment to automate regular transfers.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              Create Recurring Payment
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      payment.status === "active" ? "bg-primary/10 text-primary" :
                      payment.status === "paused" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-green-500/10 text-green-500"
                    }`}>
                      <RefreshCw className={`h-5 w-5 ${payment.status === "active" ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {payment.recipientName || payment.recipient.slice(0, 8) + "..." + payment.recipient.slice(-6)}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          payment.status === "active" ? "bg-primary/10 text-primary" :
                          payment.status === "paused" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-green-500/10 text-green-500"
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {payment.amount} {payment.token}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatFrequency(payment.frequency)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Next: {payment.nextPayment.toLocaleDateString()}
                        </span>
                        {payment.occurrences && (
                          <span>
                            {payment.totalSent} of {payment.occurrences} sent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePause(payment.id)}
                      className={`rounded-lg p-2 transition-colors ${
                        payment.status === "paused"
                          ? "text-green-500 hover:bg-green-500/10"
                          : "text-yellow-500 hover:bg-yellow-500/10"
                      }`}
                      title={payment.status === "active" ? "Pause" : "Resume"}
                    >
                      {payment.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deletePayment(payment.id)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <h3 className="mb-6 font-display text-xl text-foreground">Create Recurring Payment</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Recipient</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Email or wallet address"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Token</label>
                    <select
                      value={token}
                      onChange={(e) => setToken(e.target.value as Token)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="PASS">PASS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as Frequency)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">End after occurrences</label>
                    <button
                      type="button"
                      onClick={() => setHasOccurrences(!hasOccurrences)}
                      className={`h-6 w-11 rounded-full transition-colors ${hasOccurrences ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${hasOccurrences ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {hasOccurrences && (
                    <input
                      type="number"
                      value={occurrences}
                      onChange={(e) => setOccurrences(e.target.value)}
                      min="1"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Set end date</label>
                    <button
                      type="button"
                      onClick={() => setHasEndDate(!hasEndDate)}
                      className={`h-6 w-11 rounded-full transition-colors ${hasEndDate ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${hasEndDate ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {hasEndDate && (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">
                    Balance: <span className="font-medium text-foreground">{getBalance().toFixed(2)} {token}</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { setShowCreate(false); resetForm(); }}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                  {!creating && <Check className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

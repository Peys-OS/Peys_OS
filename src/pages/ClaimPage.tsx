import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Clock, AlertCircle, Loader2, ArrowRight, Gift } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fireBurst } from "@/utils/confetti";

interface PaymentData {
  id: string;
  payment_id: string;
  sender_email: string;
  recipient_email: string;
  amount: number;
  token: string;
  memo: string | null;
  status: string;
  expires_at: string;
  created_at: string;
}

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, login } = useApp();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayment = async () => {
      if (!id) {
        setError("Invalid claim link");
        setLoading(false);
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from("payments")
        .select("*")
        .eq("claim_link", id)
        .single();

      if (fetchErr || !data) {
        setError("Payment not found. The link may be invalid or expired.");
        setLoading(false);
        return;
      }

      setPayment(data as PaymentData);
      setLoading(false);
    };

    fetchPayment();
  }, [id]);

  const handleClaim = async () => {
    if (!isLoggedIn) {
      login();
      return;
    }

    if (!payment) return;

    setClaiming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to claim");
        setClaiming(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from("payments")
        .update({
          status: "claimed",
          claimed_by_user_id: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
        .eq("status", "pending");

      if (updateErr) throw updateErr;

      // Notify sender
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", payment.sender_email)
        .single();

      if (senderProfile) {
        await supabase.from("notifications").insert({
          user_id: senderProfile.user_id,
          type: "payment_claimed",
          title: `✅ Payment of ${payment.amount} ${payment.token} claimed!`,
          message: `${user.email || "Someone"} claimed your payment of ${payment.amount} ${payment.token}.`,
          payment_id: payment.id,
        });
      }

      setClaimed(true);
      fireBurst();
      toast.success("Payment claimed successfully! 🎉");
    } catch (err: any) {
      console.error("Claim failed:", err);
      toast.error(err.message || "Failed to claim payment");
    } finally {
      setClaiming(false);
    }
  };

  const isExpired = payment ? new Date(payment.expires_at) < new Date() : false;
  const isAlreadyClaimed = payment?.status === "claimed";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mx-auto max-w-md px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading payment...</p>
          </motion.div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-8 text-center shadow-card"
          >
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 font-display text-xl text-foreground">Payment Not Found</h2>
            <p className="mb-6 text-sm text-muted-foreground">{error}</p>
            <Link to="/" className="inline-flex rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Go Home
            </Link>
          </motion.div>
        ) : claimed ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-border bg-card p-8 text-center shadow-card"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mb-2 font-display text-xl text-foreground">Payment Claimed! 🎉</h2>
            <p className="mb-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{payment?.amount} {payment?.token}</span> has been added to your wallet.
            </p>
            <p className="mb-6 text-xs text-muted-foreground">From {payment?.sender_email}</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              View Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
          >
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center sm:p-8">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Gift className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-2xl text-foreground sm:text-3xl">
                You received money!
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {payment?.sender_email} sent you a payment
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-6 text-center">
                <p className="font-display text-4xl text-foreground">
                  ${payment?.amount.toLocaleString("en", { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{payment?.token}</p>
              </div>

              {payment?.memo && (
                <div className="mb-6 rounded-lg border border-border bg-secondary/50 p-3 text-center">
                  <p className="text-sm text-muted-foreground">"{payment.memo}"</p>
                </div>
              )}

              <div className="mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span className="text-foreground">{payment?.sender_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${isExpired ? "text-destructive" : isAlreadyClaimed ? "text-primary" : "text-warning"}`}>
                    {isExpired ? "Expired" : isAlreadyClaimed ? "Claimed" : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="text-foreground">{new Date(payment?.expires_at || "").toLocaleDateString()}</span>
                </div>
              </div>

              {isExpired ? (
                <div className="rounded-lg bg-destructive/10 p-4 text-center">
                  <Clock className="mx-auto mb-2 h-6 w-6 text-destructive" />
                  <p className="text-sm font-medium text-destructive">This payment has expired</p>
                  <p className="mt-1 text-xs text-muted-foreground">The sender can reclaim these funds.</p>
                </div>
              ) : isAlreadyClaimed ? (
                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <Check className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="text-sm font-medium text-primary">Already claimed</p>
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {claiming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {isLoggedIn ? "Claim Payment" : "Sign In & Claim"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}

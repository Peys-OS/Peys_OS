// Send Payment Form — wired to Supabase
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Copy, Check, ArrowLeft, Download, X, Share2, Users, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "@/contexts/AppContext";
import { fireBurst } from "@/utils/confetti";
import { Link, useSearchParams } from "react-router-dom";
import PaymentCard from "@/components/PaymentCard";
import { toast } from "sonner";
import { MOCK_CONTACTS } from "@/data/contacts";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

type Token = "USDC" | "USDT";

export default function SendPaymentForm() {
  const { isLoggedIn, login, wallet, walletAddress } = useApp();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Token>("USDC");
  const [recipient, setRecipient] = useState(searchParams.get("recipient") || "");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "sending" | "done">("form");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [claimId, setClaimId] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [fullLink, setFullLink] = useState("");
  const recipientRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (recipientRef.current && !recipientRef.current.contains(e.target as Node)) {
        setShowContacts(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSend = async () => {
    if (!isLoggedIn) { login(); return; }
    if (step === "form") {
      if (!recipient) {
        toast.error("Please enter a recipient email");
        return;
      }
      if (!amount || Number(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      setStep("sending");

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in first");
          setStep("form");
          return;
        }

        const newClaimId = uuidv4();
        const claimSecret = uuidv4();
        const paymentId = `pey_${newClaimId.replace(/-/g, "").slice(0, 16)}`;
        const link = `${window.location.origin}/claim/${newClaimId}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // Save payment to database
        const { data: payment, error } = await supabase
          .from("payments")
          .insert({
            payment_id: paymentId,
            sender_user_id: user.id,
            sender_email: user.email || "",
            sender_wallet: walletAddress || null,
            recipient_email: recipient,
            amount: Number(amount),
            token,
            memo: memo || null,
            claim_secret: claimSecret,
            claim_link: newClaimId,
            status: "pending",
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (error) throw error;

        // Create notification for recipient if they exist
        const { data: recipientProfile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", recipient)
          .single();

        if (recipientProfile) {
          await supabase.from("notifications").insert({
            user_id: recipientProfile.user_id,
            type: "payment_received",
            title: `💰 You received ${Number(amount).toFixed(2)} ${token}!`,
            message: `${user.email || "Someone"} sent you ${Number(amount).toFixed(2)} ${token}${memo ? ` — "${memo}"` : ""}. Claim it now!`,
            payment_id: payment.id,
          });
        }

        // Try to send email notification via edge function
        try {
          await supabase.functions.invoke("send-payment-notification", {
            body: {
              recipientEmail: recipient,
              senderEmail: user.email,
              amount: Number(amount),
              token,
              memo,
              claimLink: link,
            },
          });
        } catch (emailErr) {
          console.warn("Email notification failed (non-blocking):", emailErr);
        }

        setClaimId(newClaimId);
        setGeneratedLink(`${window.location.host}/claim/${newClaimId}`);
        setFullLink(link);
        setStep("done");
        fireBurst();
        toast.success("Payment created! Share the link to get paid 🎉");
      } catch (err: any) {
        console.error("Payment creation failed:", err);
        toast.error(err.message || "Failed to create payment");
        setStep("confirm");
      }
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(fullLink);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `pey-payment-${claimId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const shareLink = async () => {
    const shareData = {
      title: `Payment of ${amount} ${token} on Pey`,
      text: `Claim your ${amount} ${token}! ${memo || ""}`,
      url: fullLink,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      copyLink();
    }
  };

  const balance = token === "USDC" ? wallet.balanceUSDC : wallet.balanceUSDT;

  return (
    <div className="relative mx-auto max-w-md px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-card sm:rounded-2xl"
      >
        <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            {step !== "form" && step !== "sending" && (
              <button onClick={() => setStep("form")} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="font-display text-lg text-foreground sm:text-xl">Send Payment</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 sm:space-y-4">
                <div className="flex gap-2">
                  {(["USDC", "USDT"] as Token[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setToken(t)}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                        token === t
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {isLoggedIn && (
                  <p className="text-xs text-muted-foreground">Balance: {balance.toFixed(2)} {token}</p>
                )}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground sm:text-2xl">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-9 pr-4 text-2xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring sm:py-4 sm:pl-10 sm:text-3xl"
                  />
                </div>
                <div className="relative" ref={recipientRef}>
                  <div className="relative">
                    <input
                      value={recipient}
                      onChange={(e) => { setRecipient(e.target.value); setShowContacts(true); }}
                      onFocus={() => setShowContacts(true)}
                      placeholder="Recipient email address"
                      type="email"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring sm:py-3"
                    />
                    <button
                      type="button"
                      onClick={() => setShowContacts(!showContacts)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                  </div>
                  <AnimatePresence>
                    {showContacts && (() => {
                      const q = recipient.toLowerCase();
                      const filtered = MOCK_CONTACTS.filter(
                        (c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
                      );
                      if (filtered.length === 0) return null;
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-elevated"
                        >
                          <div className="max-h-48 overflow-y-auto py-1">
                            {filtered.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => { setRecipient(c.email); setShowContacts(false); }}
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
                <input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Add a note (optional)"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring sm:py-3"
                />
                <button
                  onClick={handleSend}
                  disabled={!amount || Number(amount) <= 0 || !recipient}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50 sm:py-3.5"
                >
                  <Send className="h-4 w-4" />
                  {isLoggedIn ? "Review Payment" : "Sign In to Send"}
                </button>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3 sm:space-y-4">
                <div className="space-y-2.5 rounded-xl border border-border bg-secondary/50 p-3 sm:space-y-3 sm:p-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-semibold text-foreground">{Number(amount).toFixed(2)} {token}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">To</span><span className="text-foreground">{recipient}</span></div>
                  {memo && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Note</span><span className="text-foreground">{memo}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Expires</span><span className="text-foreground">7 days</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Network fee</span><span className="font-medium text-primary">~$0.01</span></div>
                </div>
                <button onClick={handleSend} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 sm:py-3.5">
                  Confirm & Send
                </button>
              </motion.div>
            )}

            {step === "sending" && (
              <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Creating payment...</p>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center sm:space-y-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:h-14 sm:w-14">
                  <Check className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                </div>
                <h3 className="font-display text-lg text-foreground sm:text-xl">Payment Created! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  {Number(amount).toFixed(2)} {token} sent to <span className="font-medium text-foreground">{recipient}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {recipient} will receive a notification. If they're not on Pey yet, they can sign up and claim instantly.
                </p>

                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 p-2.5 sm:p-3">
                  <span className="flex-1 truncate text-xs text-foreground sm:text-sm">{generatedLink}</span>
                  <button onClick={copyLink} className="rounded-lg border border-border bg-card p-1.5 transition-colors hover:bg-secondary sm:p-2">
                    {linkCopied ? <Check className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setShowQR(true)} className="flex flex-col items-center gap-1 rounded-xl border border-border py-3 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="18" width="3" height="3" /></svg>
                    QR Code
                  </button>
                  <button onClick={shareLink} className="flex flex-col items-center gap-1 rounded-xl border border-border py-3 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <Share2 className="h-5 w-5" />
                    Share
                  </button>
                  <button onClick={() => setShowCard(true)} className="flex flex-col items-center gap-1 rounded-xl border border-border py-3 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /></svg>
                    Card
                  </button>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setStep("form"); setAmount(""); setRecipient(""); setMemo(""); }}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:py-3"
                  >Send Another</button>
                  <Link to="/dashboard" className="flex flex-1 items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:py-3">
                    Dashboard
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl border border-border bg-card p-6 shadow-elevated text-center"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-foreground">QR Code</h3>
                <button onClick={() => setShowQR(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div ref={qrRef} className="mx-auto mb-4 flex items-center justify-center rounded-xl bg-background p-4">
                <QRCodeSVG value={fullLink} size={200} bgColor="transparent" fgColor="currentColor" className="text-foreground" level="M" />
              </div>
              <p className="mb-4 text-xs text-muted-foreground break-all">{fullLink}</p>
              <button onClick={downloadQR} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                <Download className="h-4 w-4" /> Download QR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Card Modal */}
      <AnimatePresence>
        {showCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
            onClick={() => setShowCard(false)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <div className="mb-3 flex justify-end">
                <button onClick={() => setShowCard(false)} className="rounded-full bg-card p-2 text-muted-foreground hover:text-foreground border border-border">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <PaymentCard
                sender="You"
                amount={Number(amount)}
                token={token}
                memo={memo}
                claimId={claimId}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

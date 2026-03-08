import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Send $50 USDC to alice@email.com",
  "Check my balance",
  "Show recent transactions",
  "How do claim links work?",
];

function parsePaymentIntent(text: string): { amount?: number; token?: string; recipient?: string; memo?: string } | null {
  const amountMatch = text.match(/\$?(\d+(?:\.\d+)?)/);
  const tokenMatch = text.match(/\b(USDC|USDT)\b/i);
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  
  if (amountMatch) {
    return {
      amount: parseFloat(amountMatch[1]),
      token: tokenMatch ? tokenMatch[1].toUpperCase() : "USDC",
      recipient: emailMatch ? emailMatch[0] : undefined,
    };
  }
  return null;
}

function generateResponse(text: string): string {
  const lower = text.toLowerCase();
  
  const intent = parsePaymentIntent(text);
  if (intent?.amount && intent.recipient) {
    return `I'll help you send **$${intent.amount} ${intent.token || "USDC"}** to **${intent.recipient}**.\n\n→ [Open Send Form](/send) to complete this payment.\n\nFunds will be held in escrow until claimed.`;
  }
  if (intent?.amount) {
    return `Got it — **$${intent.amount} ${intent.token || "USDC"}**. Who should I send it to? Provide an email or just go to the [Send page](/send).`;
  }
  
  if (lower.includes("balance")) {
    return "Your current balance:\n\n• **USDC**: $1,250.00 (4.2% APY)\n• **USDT**: $340.50\n• **Total**: $1,590.50\n\nView details on your [Dashboard](/dashboard).";
  }
  if (lower.includes("transaction") || lower.includes("recent") || lower.includes("history")) {
    return "Here are your recent transactions:\n\n1. 🔴 Sent $50 USDC → moses@email.com (1h ago)\n2. 🟢 Claimed $200 USDT from alice@email.com (1d ago)\n3. ⏳ Pending $100 USDC → bob@email.com (2h ago)\n\nSee all on your [Dashboard](/dashboard).";
  }
  if (lower.includes("claim") || lower.includes("link") || lower.includes("how")) {
    return "**How Peys Claim Links work:**\n\n1. You send a payment → funds go into escrow\n2. A unique magic link is generated\n3. Share it via email, text, or QR code\n4. Recipient signs in with email/Google\n5. A wallet is auto-created → they claim instantly\n\nUnclaimed funds auto-refund after 7 days. 🔒";
  }
  if (lower.includes("fee") || lower.includes("cost")) {
    return "Peys has **near-zero fees**:\n\n• Network fee: ~$0.01 per transaction\n• Peys fee: **$0** (free during hackathon)\n• Powered by Polkadot Asset Hub";
  }
  
  return "I can help you with:\n\n• **Send payments** — \"Send $50 USDC to alice@email.com\"\n• **Check balance** — \"What's my balance?\"\n• **View transactions** — \"Show recent activity\"\n• **Learn** — \"How do claim links work?\"\n\nWhat would you like to do?";
}

export default function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Peys AI 👋 I can help you send payments, check balances, and answer questions. Try saying \"Send $50 USDC to alice@email.com\"" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(userMsg.content);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
        whileTap={{ scale: 0.9 }}
        aria-label="Open AI assistant"
      >
        {isOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 z-50 flex h-[28rem] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated sm:bottom-24 sm:right-6 sm:w-96 sm:h-[32rem]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Peys AI</p>
                <p className="text-xs text-muted-foreground">Payment assistant</p>
              </div>
              <div className="ml-auto flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {msg.content.split("\n").map((line, j) => (
                      <p key={j} className={j > 0 ? "mt-1" : ""}>
                        {line.split(/(\*\*.*?\*\*)/).map((part, k) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <strong key={k}>{part.slice(2, -2)}</strong>
                          ) : part.startsWith("[") && part.includes("](/") ? (
                            <a key={k} href={part.match(/\((.*?)\)/)?.[1] || "#"} className="underline text-primary">
                              {part.match(/\[(.*?)\]/)?.[1]}
                            </a>
                          ) : (
                            <span key={k}>{part}</span>
                          )
                        )}
                      </p>
                    ))}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex gap-1 rounded-xl bg-secondary px-3 py-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-3">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Send $50 USDC to..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

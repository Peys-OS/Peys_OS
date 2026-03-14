// Send Payment Form — wired to Supabase
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Copy, Check, ArrowLeft, Download, X, Share2, Users, Loader2, Network, ChevronDown, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "@/contexts/AppContext";
import { fireBurst } from "@/utils/confetti";
import { Link, useSearchParams } from "react-router-dom";
import PaymentCard from "@/components/PaymentCard";
import { toast } from "sonner";
import { MOCK_CONTACTS } from "@/data/contacts";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { useEscrow, getChainConfig } from "@/hooks/useEscrow";
import { Address, keccak256, toHex, parseAbiItem, getEventSelector, decodeEventLog } from "viem";
import { usePublicClient, useAccount, useSwitchChain, useChainId } from "wagmi";

type Token = "USDC" | "USDT";

interface NetworkOption {
  id: number;
  name: string;
  shortName: string;
  color: string;
}

const networks: NetworkOption[] = [
  { id: 84532, name: "Base Sepolia", shortName: "Base", color: "#0056FF" },
  { id: 44787, name: "Celo Alfajores", shortName: "Celo", color: "#35D07F" },
  { id: 420420421, name: "Polkadot", shortName: "Polkadot", color: "#E6007A" },
];

export default function SendPaymentForm() {
  const { isLoggedIn, login, wallet, walletAddress } = useApp();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Token>("USDC");
  const [selectedNetwork, setSelectedNetwork] = useState<number>(84532);
  const [recipient, setRecipient] = useState(searchParams.get("recipient") || "");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "sending" | "done">("form");
  const [sendingPhase, setSendingPhase] = useState<"approving" | "creating" | "waiting">("waiting");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [claimId, setClaimId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [fullLink, setFullLink] = useState("");
  const recipientRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);

  const { createPayment } = useEscrow();
  const publicClient = usePublicClient();
  const { chain: connectedChain } = useAccount();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  // Auto-detect network from connected wallet
  useEffect(() => {
    if (connectedChain?.id && networks.find(n => n.id === connectedChain.id)) {
      setSelectedNetwork(connectedChain.id);
    }
  }, [connectedChain]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (recipientRef.current && !recipientRef.current.contains(e.target as Node)) {
        setShowContacts(false);
      }
      if (networkRef.current && !networkRef.current.contains(e.target as Node)) {
        setShowNetworkSelector(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentNetwork = networks.find(n => n.id === selectedNetwork) || networks[0];
  const config = getChainConfig(selectedNetwork);

  const handleNetworkChange = async (networkId: number) => {
    setSelectedNetwork(networkId);
    setShowNetworkSelector(false);
    
    // Switch wallet to selected network
    if (switchChain && networkId !== chainId) {
      try {
        switchChain({ chainId: networkId });
      } catch (err) {
        console.log("Wallet switch rejected, will use selected network");
      }
    }
  };

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

      // Check if user has sufficient balance
      if (Number(amount) > balance) {
        toast.error(`Insufficient ${token} balance on ${currentNetwork.name}. You have ${balance.toFixed(2)} ${token}.`);
        return;
      }

      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      setStep("sending");
      setSendingPhase("waiting");

      try {
        // Check if user is logged in via Privy
        if (!isLoggedIn || !walletAddress) {
          toast.error("Please sign in first");
          setStep("form");
          return;
        }

        // Double-check balance before transaction
        if (Number(amount) > balance) {
          toast.error(`Insufficient ${token} balance. You have ${balance.toFixed(2)} ${token}.`);
          setStep("form");
          return;
        }

        const newClaimId = uuidv4();
        const claimSecret = uuidv4();
        const paymentId = `peys_${newClaimId.replace(/-/g, "").slice(0, 16)}`;
        const link = `${window.location.origin}/claim/${newClaimId}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Save preliminary payment to database using wallet address as sender identifier
        const { data: payment, error } = await supabase
          .from("payments")
          .insert({
            payment_id: paymentId,
            sender_user_id: null, // Using wallet address instead
            sender_email: "", // Could collect email from Privy if available
            sender_wallet: walletAddress,
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

        // 2. Create payment on blockchain
        const chainId = selectedNetwork;
        const chainConfig = getChainConfig(chainId);
        const tokenAddress = token === "USDC" ? chainConfig.usdcAddress : chainConfig.usdtAddress;
        const amountBigInt = BigInt(Number(amount) * 1000000); // USDC has 6 decimals
        const expiryDays = 7;

        setSendingPhase("approving");
        
        let txHash;
        try {
          txHash = await createPayment(
            tokenAddress as Address,
            amountBigInt,
            claimSecret,
            memo || "",
            expiryDays,
            () => {
              // Approval transaction is being sent
              setSendingPhase("approving");
            },
            () => {
              // Approval confirmed, now creating the payment
              setSendingPhase("creating");
            }
          );
        } catch (txError: unknown) {
          console.error("Transaction error:", txError);
          const errorMsg = (txError as Error).message || '';
          
          // Check for user rejection - more specific message
          if (errorMsg.includes('user rejected') || 
              errorMsg.includes('cancelled') ||
              errorMsg.includes('was not confirmed') ||
              errorMsg.includes('WALLET_REJECTED') ||
              errorMsg.includes('not submitted')) {
            throw new Error("Transaction was not confirmed. Please click 'Confirm' in your wallet to sign the transaction.");
          }
          
          // Check for nonce or RPC errors
          if (errorMsg.includes('nonce') || errorMsg.includes('-32000') || errorMsg.includes('-32002') || errorMsg.includes('too many errors')) {
            throw new Error("Wallet nonce issue detected. Please open your wallet, go to activity, and cancel or speed up any pending transactions. Then refresh this page and try again.");
          }
          
          // For other errors, show a generic message but include details
          throw new Error(`Transaction failed: ${errorMsg || 'Unknown error'}`);
        }

        if (!txHash) throw new Error("Failed to create transaction - no transaction hash received");

        console.log("=== Got Transaction Hash ===");
        console.log("txHash:", txHash);
        setTxHash(txHash);

        // 3. Wait for transaction receipt and extract paymentId from logs
        if (!publicClient) throw new Error("Public client not available - please refresh and try again");
        
        console.log("=== Waiting for transaction receipt ===");
        
        let receipt;
        try {
          receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
          console.log("=== Receipt Received ===");
          console.log("Receipt status:", receipt?.status);
        } catch (receiptError: unknown) {
          console.error("Failed to get receipt:", receiptError);
          // If the transaction was submitted but we can't get receipt, it might still have gone through
          // Show success with a note
          toast.warning("Transaction submitted but could not confirm receipt. Please check your wallet activity.");
          // Still try to update the payment record
        }
        
        if (!receipt) {
          // Receipt not found - transaction might still be pending
          // Save with tx hash anyway so user can track it
          console.warn("Transaction receipt not found, payment may still be pending");
        }

        // Find the PaymentCreated event log
        const paymentCreatedTopic = getEventSelector(parseAbiItem('event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address token, uint256 amount, uint256 expiry, string memo)'));
        
        const log = receipt?.logs ? (receipt.logs as Array<{ topics: string[], data: string }>).find(l => l.topics[0] === paymentCreatedTopic) : null;
        
        let blockchainPaymentId: string | null = null;
        
        if (log) {
          try {
            const decoded = decodeEventLog({
              abi: [parseAbiItem('event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address token, uint256 amount, uint256 expiry, string memo)')],
              data: log.data,
              topics: log.topics,
            }) as { args: { paymentId: string } };
            
            blockchainPaymentId = decoded.args.paymentId;
          } catch (decodeError) {
            console.warn("Failed to decode event log:", decodeError);
          }
        }

        // 4. Update database with blockchain paymentId and transaction hash
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            tx_hash: txHash,
            blockchain_payment_id: blockchainPaymentId,
          })
          .eq("id", payment.id);

        if (updateError) throw updateError;

        // 5. Notify recipient if they exist
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
            message: `${walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "Someone"} sent you ${Number(amount).toFixed(2)} ${token}${memo ? ` — "${memo}"` : ""}. Claim it now!`,
            payment_id: payment.id,
          });
        }

        // 6. Send email notification
        console.log("=== Sending email notification ===");
        console.log("Recipient:", recipient);
        console.log("Claim link:", link);
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke("send-payment-notification", {
            body: {
              recipientEmail: recipient,
              senderEmail: walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "",
              amount: Number(amount),
              token,
              memo,
              claimLink: link,
              appUrl: window.location.origin,
            },
          });
          console.log("Email response:", emailData);
          if (emailError) {
            console.error("Email error:", emailError);
          }
        } catch (emailErr) {
          console.error("Email notification failed (non-blocking):", emailErr);
        }

        setClaimId(newClaimId);
        setGeneratedLink(`${window.location.host}/claim/${newClaimId}`);
        setFullLink(link);
        setStep("done");
        fireBurst();
        toast.success("Payment created! Share the link to get paid 🎉");
      } catch (err: unknown) {
        console.error("Payment creation failed:", err);
        const errorMessage = (err as Error).message || "Failed to create payment";
        
        // Check for nonce-related errors
        if (errorMessage.includes('nonce') || errorMessage.includes('Nonce too low')) {
          toast.error("Nonce error: Please check MetaMask for pending transactions. You can cancel or speed up the stuck transaction, then try again.");
        } else {
          toast.error(errorMessage);
        }
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

  const shareLink = async () => {
    const shareData = {
      title: `Payment of ${amount} ${token} on Peys`,
      text: `Claim your ${amount} ${token}! ${memo || ""}`,
      url: fullLink,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {
        // Ignore share errors
      }
    } else {
      copyLink();
    }
  };

  // Get balance for selected network
  const networkBalance = wallet.networkBalances?.find(nb => nb.chainId === selectedNetwork);
  const balance = networkBalance 
    ? (token === "USDC" ? networkBalance.usdc : networkBalance.usdt)
    : (token === "USDC" ? wallet.balanceUSDC : wallet.balanceUSDT);

  return (
    <div className="relative mx-auto max-w-md px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
      {/* Login overlay when not signed in */}
      {!isLoggedIn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm"
        >
          <div className="text-center">
            <h3 className="mb-2 font-display text-lg text-foreground">Sign in to send payments</h3>
            <p className="mb-4 text-sm text-muted-foreground">Connect your wallet to start sending money.</p>
            <button
              onClick={login}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`overflow-hidden rounded-xl border border-border bg-card shadow-card sm:rounded-2xl ${!isLoggedIn ? "pointer-events-none select-none opacity-40" : ""}`}
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
                
                {/* Network Selector */}
                <div className="relative" ref={networkRef}>
                  <button
                    type="button"
                    onClick={() => setShowNetworkSelector(!showNetworkSelector)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: currentNetwork.color }}
                      >
                        {currentNetwork.shortName.slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">Network</p>
                        <p className="font-medium text-foreground">{currentNetwork.name}</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showNetworkSelector ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showNetworkSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-elevated"
                      >
                        {networks.map((network) => (
                          <button
                            key={network.id}
                            type="button"
                            onClick={() => handleNetworkChange(network.id)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60 ${selectedNetwork === network.id ? 'bg-primary/10' : ''}`}
                          >
                            <div 
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: network.color }}
                            >
                              {network.shortName.slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{network.name}</p>
                            </div>
                            {selectedNetwork === network.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Token Selector */}
                <div className="flex gap-2">
                  {(["USDC", "USDT"] as Token[])
                    .filter((t) => {
                      // Filter out USDT if not available on current network
                      if (t === "USDT") {
                        const chainConfig = getChainConfig(selectedNetwork);
                        return !!chainConfig.usdtAddress && chainConfig.usdtAddress !== "";
                      }
                      return true;
                    })
                    .map((t) => (
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
                  <p className="text-xs text-muted-foreground">
                    Balance: {balance.toFixed(2)} {token} on {currentNetwork.shortName}
                  </p>
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
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-foreground">{Number(amount).toFixed(2)} {token}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span className="flex items-center gap-2">
                      <div 
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: currentNetwork.color }}
                      />
                      <span className="text-foreground">{currentNetwork.name}</span>
                    </span>
                  </div>
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
                <p className="text-sm text-muted-foreground">
                  {sendingPhase === "approving" 
                    ? `Approving ${token} on ${currentNetwork.name}...` 
                    : sendingPhase === "creating"
                    ? `Creating payment on ${currentNetwork.name}...`
                    : `Processing on ${currentNetwork.name}...`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {sendingPhase === "approving" 
                    ? "Check your wallet to confirm the approval" 
                    : "Please wait, this may take a moment"
                  }
                </p>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center sm:space-y-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:h-14 sm:w-14">
                  <Check className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                </div>
                <h3 className="font-display text-lg text-foreground sm:text-xl">Payment Created! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  {Number(amount).toFixed(2)} {token} sent on <span className="font-medium text-foreground">{currentNetwork.name}</span>
                </p>
                {txHash && (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs text-muted-foreground">Transaction Hash:</p>
                    <a 
                      href={`${currentNetwork.blockExplorer}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[280px] truncate text-xs text-primary hover:underline"
                    >
                      {txHash}
                    </a>
                  </div>
                )}
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
                  <button onClick={() => { setStep("form"); setAmount(""); setRecipient(""); setMemo(""); setTxHash(""); }} className="flex flex-col items-center gap-1 rounded-xl border border-border py-3 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <Send className="h-5 w-5" />
                    Send Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative rounded-2xl bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <div ref={qrRef} className="p-2">
                <QRCodeSVG value={fullLink} size={200} />
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">Scan to claim payment</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCard && (
          <PaymentCard
            payment={{
              id: claimId,
              amount: Number(amount),
              token,
              recipient,
              memo,
              status: "pending",
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }}
            link={fullLink}
            onClose={() => setShowCard(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

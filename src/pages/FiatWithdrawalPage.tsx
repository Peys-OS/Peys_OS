import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Building2,
  Plus,
  Trash2,
  ArrowRight,
  Loader2,
  ChevronDown,
  Search,
  Check,
  AlertCircle,
  Globe,
  Banknote,
  Users,
  Clock,
  Star,
  X,
  RefreshCw,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  flutterwaveService,
  SUPPORTED_COUNTRIES,
  CURRENCY_SYMBOLS,
  formatCurrency,
  getUserBankAccounts,
  saveBankAccount,
  deleteBankAccount,
  createWithdrawal,
  getUserWithdrawals,
  getP2POrders,
  createP2POrder,
  matchP2POrder,
} from "@/services/flutterwaveService";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  country: string;
  is_primary: boolean;
}

interface Withdrawal {
  id: string;
  amount_fiat: number;
  amount_usdc: number;
  currency: string;
  status: string;
  created_at: string;
  bank_accounts?: BankAccount;
}

type Tab = "withdraw" | "accounts" | "history" | "p2p";
type WithdrawalType = "direct" | "p2p";

export default function FiatWithdrawalPage() {
  const { isLoggedIn, login, walletAddress } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("withdraw");
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>("direct");
  
  const [country, setCountry] = useState("NG");
  const [currency, setCurrency] = useState("NGN");
  const [fiatAmount, setFiatAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState(1520);
  const [fee, setFee] = useState(0);
  const [loadingRate, setLoadingRate] = useState(false);
  
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountVerified, setAccountVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const [savedAccounts, setSavedAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [processing, setProcessing] = useState(false);
  
  const [p2pOrders, setP2POrders] = useState<any[]>([]);
  const [p2pType, setP2pType] = useState<"buy" | "sell">("buy");
  const [p2pPrice, setP2pPrice] = useState("");
  const [p2pAmount, setP2pAmount] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);

  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === country);

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchSavedAccounts();
      fetchWithdrawals();
      fetchP2POrders();
    }
  }, [isLoggedIn, walletAddress]);

  useEffect(() => {
    const countryObj = SUPPORTED_COUNTRIES.find((c) => c.code === country);
    if (countryObj) {
      setCurrency(countryObj.currency);
    }
  }, [country]);

  useEffect(() => {
    if (fiatAmount) {
      fetchExchangeRate();
    }
  }, [fiatAmount, currency]);

  useEffect(() => {
    if (selectedCountry) {
      fetchBanks();
    }
  }, [country]);

  const fetchExchangeRate = async () => {
    if (!fiatAmount) return;
    setLoadingRate(true);
    try {
      const rate = 1520;
      setExchangeRate(rate);
      const calculatedUsdc = parseFloat(fiatAmount) / rate;
      setUsdcAmount(calculatedUsdc.toFixed(2));
      setFee(Math.max(parseFloat(fiatAmount) * 0.01, 50));
    } catch (error) {
      console.error("Failed to fetch rate:", error);
    } finally {
      setLoadingRate(false);
    }
  };

  const fetchBanks = async () => {
    const banksList = await flutterwaveService.getBanks(country);
    setBanks(banksList);
  };

  const fetchSavedAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const accounts = await getUserBankAccounts(user.id);
    setSavedAccounts(accounts);
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0]);
      const acc = accounts[0];
      const countryObj = SUPPORTED_COUNTRIES.find((c) => c.code === acc.country);
      if (countryObj) {
        setCountry(acc.country);
        setCurrency(countryObj.currency);
      }
    }
  };

  const fetchWithdrawals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const history = await getUserWithdrawals(user.id);
    setWithdrawals(history);
  };

  const fetchP2POrders = async () => {
    const orders = await getP2POrders(p2pType, currency, 20);
    setP2POrders(orders);
  };

  const verifyAccount = async () => {
    if (!selectedBank || !accountNumber) return;
    setVerifying(true);
    try {
      const result = await flutterwaveService.resolveAccount(
        selectedBank.code,
        accountNumber
      );
      if (result.is_valid) {
        setAccountName(result.account_name);
        setAccountVerified(true);
        toast.success("Account verified!");
      } else {
        toast.error("Could not verify account");
      }
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleAddAccount = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      toast.error("Please fill all fields");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const result = await saveBankAccount(
      user.id,
      selectedBank.code,
      selectedBank.name,
      accountNumber,
      accountName,
      country
    );
    
    if (result) {
      toast.success("Bank account saved!");
      setShowAddAccount(false);
      setAccountNumber("");
      setAccountName("");
      setAccountVerified(false);
      setSelectedBank(null);
      fetchSavedAccounts();
    }
  };

  const handleWithdraw = async () => {
    if (!fiatAmount || !usdcAmount) {
      toast.error("Please enter an amount");
      return;
    }

    if (!selectedAccount) {
      toast.error("Please select or add a bank account");
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await createWithdrawal(
        user.id,
        parseFloat(fiatAmount),
        parseFloat(usdcAmount),
        currency,
        selectedAccount.id,
        withdrawalType
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Withdrawal initiated!");
      setFiatAmount("");
      setUsdcAmount("");
      fetchWithdrawals();
      setActiveTab("history");
    } catch (error) {
      toast.error("Withdrawal failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateP2POrder = async () => {
    if (!p2pPrice || !p2pAmount) {
      toast.error("Please fill all fields");
      return;
    }
    setCreatingOrder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await createP2POrder(
        user.id,
        p2pType,
        parseFloat(p2pAmount),
        parseFloat(p2pPrice),
        currency
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("P2P order created!");
      setP2pPrice("");
      setP2pAmount("");
      fetchP2POrders();
    } catch (error) {
      toast.error("Failed to create order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleMatchP2P = async (orderId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await matchP2POrder(orderId, user.id);
      if (result.success) {
        toast.success("Order matched!");
        fetchP2POrders();
      } else {
        toast.error(result.error || "Failed to match");
      }
    } catch (error) {
      toast.error("Failed to match order");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-500/10";
      case "pending":
      case "processing":
        return "text-yellow-500 bg-yellow-500/10";
      case "failed":
      case "cancelled":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Banknote className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">
            Fiat Withdrawal
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Withdraw your stablecoins to your local bank account
          </p>
          <button
            onClick={login}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            Sign In to Continue
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-8">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">
            Fiat Withdrawal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Convert and withdraw to your local bank account
          </p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "withdraw", label: "Withdraw", icon: Banknote },
            { id: "p2p", label: "P2P Market", icon: Users },
            { id: "accounts", label: "Accounts", icon: Building2 },
            { id: "history", label: "History", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "withdraw" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setWithdrawalType("direct")}
                  className={`flex-1 rounded-lg p-3 text-sm font-medium transition-colors ${
                    withdrawalType === "direct"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Direct Transfer
                </button>
                <button
                  onClick={() => setWithdrawalType("p2p")}
                  className={`flex-1 rounded-lg p-3 text-sm font-medium transition-colors ${
                    withdrawalType === "p2p"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  P2P Marketplace
                </button>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3"
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  value={fiatAmount}
                  onChange={(e) => setFiatAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-2xl font-semibold"
                />
              </div>

              {fiatAmount && (
                <div className="mb-6 rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="font-medium">
                      1 USDC = {CURRENCY_SYMBOLS[currency]}{exchangeRate.toLocaleString()}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fee (1%)</span>
                    <span className="font-medium">
                      {CURRENCY_SYMBOLS[currency]}{fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                    <span className="text-muted-foreground">You'll receive</span>
                    <span className="text-lg font-bold">
                      {CURRENCY_SYMBOLS[currency]}
                      {(parseFloat(fiatAmount) - fee).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">USDC to spend</span>
                    <span className="font-medium">{usdcAmount} USDC</span>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">
                  Bank Account
                </label>
                {savedAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {savedAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedAccount(acc)}
                        className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                          selectedAccount?.id === acc.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <div>
                          <p className="font-medium">{acc.bank_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {acc.account_number} - {acc.account_name}
                          </p>
                        </div>
                        {selectedAccount?.id === acc.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowAddAccount(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Account
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-muted-foreground hover:bg-muted"
                  >
                    <Plus className="h-5 w-5" />
                    Add Bank Account
                  </button>
                )}
              </div>

              <button
                onClick={handleWithdraw}
                disabled={!fiatAmount || !selectedAccount || processing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Withdraw {CURRENCY_SYMBOLS[currency]}
                    {(parseFloat(fiatAmount) - fee).toFixed(2)}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "p2p" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">Create P2P Order</h3>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setP2pType("sell")}
                    className={`flex-1 rounded-lg p-3 text-sm font-medium ${
                      p2pType === "sell"
                        ? "bg-green-500 text-white"
                        : "bg-muted"
                    }`}
                  >
                    I want to SELL USDC
                  </button>
                  <button
                    onClick={() => setP2pType("buy")}
                    className={`flex-1 rounded-lg p-3 text-sm font-medium ${
                      p2pType === "buy"
                        ? "bg-blue-500 text-white"
                        : "bg-muted"
                    }`}
                  >
                    I want to BUY USDC
                  </button>
                </div>
              </div>
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {p2pType === "sell" ? "Amount to Sell (USDC)" : "Amount to Buy (USDC)"}
                  </label>
                  <input
                    type="number"
                    value={p2pAmount}
                    onChange={(e) => setP2pAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Price per USDC ({currency})
                  </label>
                  <input
                    type="number"
                    value={p2pPrice}
                    onChange={(e) => setP2pPrice(e.target.value)}
                    placeholder={exchangeRate.toString()}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  />
                </div>
              </div>
              {p2pAmount && p2pPrice && (
                <div className="mb-4 rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Total {p2pType === "sell" ? "you'll receive" : "you'll pay"}
                    </span>
                    <span className="text-xl font-bold">
                      {CURRENCY_SYMBOLS[currency]}
                      {(parseFloat(p2pAmount) * parseFloat(p2pPrice)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={handleCreateP2POrder}
                disabled={creatingOrder || !p2pAmount || !p2pPrice}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {creatingOrder ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `Create ${p2pType === "sell" ? "Sell" : "Buy"} Order`
                )}
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Active Orders</h3>
                <button
                  onClick={fetchP2POrders}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => { setP2pType("buy"); fetchP2POrders(); }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    p2pType === "buy" ? "bg-blue-500 text-white" : "bg-muted"
                  }`}
                >
                  Buy Orders
                </button>
                <button
                  onClick={() => { setP2pType("sell"); fetchP2POrders(); }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    p2pType === "sell" ? "bg-green-500 text-white" : "bg-muted"
                  }`}
                >
                  Sell Orders
                </button>
              </div>
              {p2pOrders.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No active orders. Be the first to create one!
                </p>
              ) : (
                <div className="space-y-3">
                  {p2pOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.amount_usdc} USDC</span>
                          <span className="text-sm text-muted-foreground">
                            @ {CURRENCY_SYMBOLS[currency]}{order.price_per_usdc}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total: {CURRENCY_SYMBOLS[currency]}{order.total_fiat}
                        </p>
                      </div>
                      <button
                        onClick={() => handleMatchP2P(order.id)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          p2pType === "buy" ? "bg-green-500" : "bg-blue-500"
                        } text-white`}
                      >
                        {p2pType === "buy" ? "Sell to" : "Buy from"} Them
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "accounts" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Saved Bank Accounts</h3>
                <button
                  onClick={() => setShowAddAccount(true)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Add Account
                </button>
              </div>
              {savedAccounts.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No saved bank accounts yet
                </p>
              ) : (
                <div className="space-y-3">
                  {savedAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="font-medium">{acc.bank_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {acc.account_number} - {acc.account_name}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm("Delete this account?")) {
                            await deleteBankAccount(acc.id);
                            fetchSavedAccounts();
                          }
                        }}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">Withdrawal History</h3>
              {withdrawals.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No withdrawals yet
                </p>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="font-medium">
                          -{CURRENCY_SYMBOLS[w.currency]}{w.amount_fiat.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {w.amount_usdc.toFixed(2)} USDC •{" "}
                          {new Date(w.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(
                          w.status
                        )}`}
                      >
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showAddAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Add Bank Account</h3>
                <button
                  onClick={() => setShowAddAccount(false)}
                  className="rounded-lg p-1 hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  >
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Bank</label>
                  <select
                    value={selectedBank?.code || ""}
                    onChange={(e) => {
                      const bank = banks.find((b) => b.code === e.target.value);
                      setSelectedBank(bank);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <option value="">Select bank</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setAccountVerified(false);
                    }}
                    placeholder="Enter account number"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3"
                  />
                </div>

                <button
                  onClick={verifyAccount}
                  disabled={!selectedBank || !accountNumber || verifying}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-medium disabled:opacity-50"
                >
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Verify Account
                    </>
                  )}
                </button>

                {accountVerified && (
                  <div className="rounded-lg bg-green-500/10 p-4">
                    <div className="flex items-center gap-2 text-green-500">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Account Verified</span>
                    </div>
                    <p className="mt-2 text-sm">{accountName}</p>
                  </div>
                )}

                <button
                  onClick={handleAddAccount}
                  disabled={!accountVerified}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Save Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Building2, Save, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import WalletReceiveCard from "@/components/WalletReceiveCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AccountType = "individual" | "organization";

interface ProfileData {
  display_name: string;
  account_type: AccountType;
  organization_name: string;
  organization_type: string;
}

const ORG_TYPES = ["NGO / Non-profit", "DAO", "Company", "Freelancer", "Government", "Other"];

export default function ProfilePage() {
  const { isLoggedIn, login, wallet, walletAddress } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    account_type: "individual",
    organization_name: "",
    organization_type: "",
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, account_type, organization_name, organization_type")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile({
          display_name: data.display_name || "",
          account_type: (data.account_type as AccountType) || "individual",
          organization_name: data.organization_name || "",
          organization_type: data.organization_type || "",
        });
      }
      setLoading(false);
    })();
  }, [isLoggedIn]);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name || null,
        account_type: profile.account_type,
        organization_name: profile.account_type === "organization" ? profile.organization_name || null : null,
        organization_type: profile.account_type === "organization" ? profile.organization_type || null : null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile saved!");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <h2 className="mb-3 font-display text-2xl text-foreground">Sign in to manage your profile</h2>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">Sign In</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-3xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <h1 className="mb-6 font-display text-2xl text-foreground sm:text-3xl">Profile</h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            {/* Account type toggle */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <p className="mb-3 text-sm font-medium text-foreground">Account Type</p>
              <div className="flex gap-2">
                {([
                  { value: "individual" as const, label: "Individual", icon: User },
                  { value: "organization" as const, label: "Organization", icon: Building2 },
                ]).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setProfile((p) => ({ ...p, account_type: value }))}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${
                      profile.account_type === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile fields */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Display Name</label>
                <input
                  value={profile.display_name}
                  onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {profile.account_type === "organization" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Organization Name</label>
                    <input
                      value={profile.organization_name}
                      onChange={(e) => setProfile((p) => ({ ...p, organization_name: e.target.value }))}
                      placeholder="Acme Corp"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Organization Type</label>
                    <select
                      value={profile.organization_type}
                      onChange={(e) => setProfile((p) => ({ ...p, organization_type: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select type...</option>
                      {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}

              <button
                onClick={save}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>

            {/* Wallet receive */}
            <WalletReceiveCard address={walletAddress || wallet.address} />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

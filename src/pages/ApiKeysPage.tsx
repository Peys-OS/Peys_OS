import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Copy, Trash2, Key, Check, AlertCircle, Activity, Zap } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  rate_limit: number;
  monthly_limit: number;
  monthly_api_calls: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface UsageData {
  month: string;
  api_calls: number;
  limit: number;
}

const TIERS = {
  free: { name: "Free", limit: 1000, rate: 10 },
  pro: { name: "Pro", limit: 100000, rate: 100 },
  enterprise: { name: "Enterprise", limit: -1, rate: 1000 },
};

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [usage, setUsage] = useState<UsageData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error loading API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const key = `pk_${crypto.randomUUID().replace(/-/g, "")}`;
      
      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          key,
          name: newKeyName,
          user_id: user.id,
          rate_limit: 10,
          monthly_limit: 1000,
          monthly_api_calls: 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys([data, ...apiKeys]);
      setNewKeyName("");
      
      toast({
        title: "API Key Created",
        description: "Make sure to copy your API key now. You won't be able to see it again!",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setApiKeys(apiKeys.filter(k => k.id !== id));
      
      toast({
        title: "API Key Revoked",
        description: "The API key has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTierInfo = (limit: number) => {
    if (limit === -1) return TIERS.enterprise;
    if (limit >= 100000) return TIERS.pro;
    return TIERS.free;
  };

  const currentTier = apiKeys.length > 0 ? getTierInfo(apiKeys[0].monthly_limit) : TIERS.free;
  const totalUsage = apiKeys.reduce((sum, k) => sum + (k.monthly_api_calls || 0), 0);
  const usagePercent = currentTier.limit > 0 ? (totalUsage / currentTier.limit) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto max-w-5xl px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
            <p className="text-muted-foreground mt-2">
              Manage your API keys for the Peys REST API and SDKs.
            </p>
          </div>

          {/* Usage Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                API Usage
              </CardTitle>
              <Badge variant={currentTier.name === "Free" ? "secondary" : "default"}>
                {currentTier.name} Plan
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This month</span>
                  <span className="font-medium">
                    {totalUsage.toLocaleString()} / {currentTier.limit === -1 ? "Unlimited" : currentTier.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Rate limit: {currentTier.rate} requests/min</span>
                  <span>{usagePercent.toFixed(1)}% used</span>
                </div>
              </div>
              
              {currentTier.name === "Free" && usagePercent > 80 && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 text-yellow-500 text-sm">
                    <Zap className="h-4 w-4" />
                    <span>You've used {usagePercent.toFixed(0)}% of your free tier. Upgrade to Pro for higher limits.</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create API Key */}
          <Card>
            <CardHeader>
              <CardTitle>Create New API Key</CardTitle>
              <CardDescription>
                API keys provide full access to your Peys account. Keep them secure!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., Production API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createApiKey()}
                />
                <Button onClick={createApiKey} disabled={creating || !newKeyName.trim()}>
                  {creating ? "Creating..." : "Create Key"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Keys List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Your API Keys
              </CardTitle>
              <CardDescription>
                Each key has its own rate limiting and usage tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API keys yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{apiKey.name}</span>
                          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                            {apiKey.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="font-mono bg-secondary px-2 py-0.5 rounded">
                            {apiKey.key.slice(0, 12)}...{apiKey.key.slice(-4)}
                          </span>
                          <span>Created {formatDate(apiKey.created_at)}</span>
                          <span>{(apiKey.monthly_api_calls || 0).toLocaleString()} calls</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApiKey(apiKey.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Get started with the Peys API in minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Install the SDK</h4>
                <pre className="bg-secondary p-3 rounded-lg overflow-x-auto text-sm">
                  <code>npm install @peys/sdk</code>
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">2. Initialize the Client</h4>
                <pre className="bg-secondary p-3 rounded-lg overflow-x-auto text-sm">
                  <code>{`import { Peys } from '@peys/sdk';

const peys = new Peys({ 
  apiKey: 'pk_xxxxxxxxxxxx' 
});`}</code>
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">3. Create a Payment</h4>
                <pre className="bg-secondary p-3 rounded-lg overflow-x-auto text-sm">
                  <code>{`const payment = await peys.createPayment({
  recipient: 'alice@example.com',
  amount: 100, // in USDC cents
  token: 'USDC'
});

console.log(payment.claimLink);`}</code>
                </pre>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" asChild>
                  <a href="/docs" className="flex items-center gap-2">
                    View Full Documentation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

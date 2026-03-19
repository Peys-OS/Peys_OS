import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Send, Copy, Check, Download, Loader2, DollarSign, Calendar, User, Mail, Clock, MoreVertical, Edit, Trash2, ExternalLink } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  token: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  createdAt: string;
  items: InvoiceItem[];
  memo?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export default function InvoicePage() {
  const { isLoggedIn, login } = useApp();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useState(() => {
    const saved = localStorage.getItem("peys_invoices");
    if (saved) {
      setInvoices(JSON.parse(saved));
    }
    setLoading(false);
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Invoice</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Create and manage professional invoices for your clients.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Create Invoices
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Invoice</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create and manage professional invoices</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <FileText className="h-4 w-4" />
            New Invoice
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No invoices yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first invoice to get started
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                      <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      ${invoice.amount.toFixed(2)} {invoice.token}
                    </p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      invoice.status === "paid" ? "bg-green-500/10 text-green-600" :
                      invoice.status === "sent" ? "bg-blue-500/10 text-blue-600" :
                      invoice.status === "overdue" ? "bg-red-500/10 text-red-600" :
                      invoice.status === "draft" ? "bg-muted text-muted-foreground" :
                      "bg-orange-500/10 text-orange-600"
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Created: {new Date(invoice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg p-2 hover:bg-secondary">
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="rounded-lg p-2 hover:bg-secondary">
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="rounded-lg p-2 hover:bg-secondary">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
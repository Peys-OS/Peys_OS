import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, Trash2, Send, Star, StarOff, Mail, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  favorite: boolean;
  total_sent: number;
  created_at: string;
  updated_at: string;
}

export default function ContactsPage() {
  const { isLoggedIn, login } = useApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      fetchContacts();
    }
  }, [isLoggedIn]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contacts:", error);
        // Fallback to empty array if table doesn't exist yet
        setContacts([]);
      } else {
        setContacts(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Contacts</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">Save frequent recipients for quick payments.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const favorites = filtered.filter((c) => c.favorite);
  const others = filtered.filter((c) => !c.favorite);

  const addContact = async () => {
    if (!newName || !newEmail) { toast.error("Name and email are required"); return; }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          name: newName,
          email: newEmail,
          favorite: false,
          total_sent: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding contact:", error);
        toast.error("Failed to add contact");
        return;
      }

      setContacts((prev) => [data, ...prev]);
      setNewName("");
      setNewEmail("");
      setShowAdd(false);
      toast.success("Contact added! 📇");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to add contact");
    }
  };

  const toggleFavorite = async (id: string) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ favorite: !contact.favorite })
        .eq("id", id);

      if (error) {
        console.error("Error updating contact:", error);
        return;
      }

      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c))
      );
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting contact:", error);
        return;
      }

      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast("Contact removed");
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-2xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">Contacts</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading ? "Loading..." : `${contacts.length} saved recipients`}
              </p>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              <UserPlus className="h-4 w-4" /> Add
            </button>
          </div>
        </motion.div>

        {/* Add contact form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="space-y-3">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email address"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">Cancel</button>
                    <button onClick={addContact} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Save Contact</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring sm:rounded-xl"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Favorites</p>
                <div className="space-y-2">
                  {favorites.map((c, i) => (
                    <ContactRow key={c.id} contact={c} index={i} onToggleFav={toggleFavorite} onDelete={deleteContact} formatDate={formatDate} />
                  ))}
                </div>
              </div>
            )}

            {/* All contacts */}
            {others.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Contacts</p>
                <div className="space-y-2">
                  {others.map((c, i) => (
                    <ContactRow key={c.id} contact={c} index={i + favorites.length} onToggleFav={toggleFavorite} onDelete={deleteContact} formatDate={formatDate} />
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No contacts found.</p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

function ContactRow({
  contact,
  index,
  onToggleFav,
  onDelete,
  formatDate,
}: {
  contact: Contact;
  index: number;
  onToggleFav: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (dateStr?: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/20 sm:p-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{contact.name}</p>
        <p className="truncate text-xs text-muted-foreground">{contact.email}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-xs text-muted-foreground">Sent: ${contact.total_sent}</p>
        <p className="text-xs text-muted-foreground">Last: {formatDate(contact.updated_at)}</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onToggleFav(contact.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary">
          {contact.favorite ? <Star className="h-4 w-4 fill-primary text-primary" /> : <StarOff className="h-4 w-4" />}
        </button>
        <Link to={`/send?recipient=${encodeURIComponent(contact.email)}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary">
          <Send className="h-4 w-4" />
        </Link>
        <button onClick={() => onDelete(contact.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

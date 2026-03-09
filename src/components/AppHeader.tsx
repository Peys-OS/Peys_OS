import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";

export default function AppHeader() {
  const { isLoggedIn, login, logout, wallet } = useApp();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const individualItems = [
    { to: "/send", label: "Send" },
    { to: "/request", label: "Request" },
    { to: "/contacts", label: "Contacts" },
  ];

  const orgItems = [
    { to: "/streaming", label: "Streams" },
    { to: "/batch", label: "Batch" },
    { to: "/analytics", label: "Analytics" },
  ];

  const handleLogin = () => {
    login();
    toast.success("Welcome back! 👋");
  };

  const handleLogout = () => {
    logout();
    toast("Signed out successfully");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16 lg:px-8">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/peys_logo_alone.png" alt="Peys" className="h-10 w-10 rounded-lg sm:h-11 sm:w-11" />
            <span className="text-base font-semibold text-foreground tracking-tight sm:text-lg">Peys</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-secondary/50 px-1.5 py-1 xl:flex">
            <Link to="/"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                location.pathname === "/"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >Home</Link>

            {/* Products dropdown */}
            <div className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button
                className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-secondary`}
              >
                Products <ChevronDown className="h-3 w-3" />
              </button>

              <AnimatePresence>
                {productsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full pt-2 z-50"
                  >
                    <div className="w-64 rounded-xl border border-border bg-card p-3 shadow-elevated">
                      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Individual</p>
                      {individualItems.map((item) => (
                        <Link key={item.to} to={item.to}
                          onClick={() => setProductsOpen(false)}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            location.pathname === item.to
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >{item.label}</Link>
                      ))}
                      <div className="my-2 border-t border-border" />
                      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Organization</p>
                      {orgItems.map((item) => (
                        <Link key={item.to} to={item.to}
                          onClick={() => setProductsOpen(false)}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            location.pathname === item.to
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >{item.label}</Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/dashboard"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                location.pathname === "/dashboard"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >Dashboard</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary sm:h-9 sm:w-9"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <NotificationBell />

            <div className="hidden items-center gap-3 xl:flex">
              {isLoggedIn ? (
                <>
                  <span className="text-sm text-muted-foreground">{wallet.address}</span>
                  <button onClick={handleLogout} className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20">Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={handleLogin} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</button>
                  <button onClick={handleLogin} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Open Account</button>
                </>
              )}
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground xl:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm xl:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-72 border-l border-border bg-card shadow-elevated xl:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <span className="text-sm font-semibold text-foreground">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                <Link to="/" onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${location.pathname === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >Home</Link>

                <p className="mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Individual</p>
                {individualItems.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${location.pathname === item.to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                  >{item.label}</Link>
                ))}

                <p className="mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Organization</p>
                {orgItems.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${location.pathname === item.to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                  >{item.label}</Link>
                ))}

                <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                  className={`mt-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${location.pathname === "/dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >Dashboard</Link>
              </nav>
              <div className="border-t border-border p-4">
                {isLoggedIn ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{wallet.address}</p>
                    <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="w-full rounded-lg bg-destructive/10 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20">Sign Out</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button onClick={() => { handleLogin(); setMobileOpen(false); }}
                      className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Open Account</button>
                    <button onClick={() => { handleLogin(); setMobileOpen(false); }}
                      className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">Login</button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

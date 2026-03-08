import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AppHeader() {
  const { isLoggedIn, login, logout } = useApp();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/send", label: "Send" },
    { to: "/request", label: "Request" },
    { to: "/streaming", label: "Streams" },
    { to: "/batch", label: "Batch" },
    { to: "/dashboard", label: "Dashboard" },
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary sm:h-8 sm:w-8">
              <span className="text-xs font-bold text-primary-foreground sm:text-sm">P</span>
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight sm:text-lg">Pey</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-secondary/50 px-1.5 py-1 xl:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >{item.label}</Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary sm:h-9 sm:w-9"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <div className="hidden items-center gap-3 xl:flex">
              {isLoggedIn ? (
                <>
                  <span className="text-sm text-muted-foreground">0x1a2B...9f4E</span>
                  <button onClick={handleLogout} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
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
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                      className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                    >{item.label}</Link>
                  );
                })}
              </nav>
              <div className="border-t border-border p-4">
                {isLoggedIn ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">0x1a2B...9f4E</p>
                    <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">Sign Out</button>
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

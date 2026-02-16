import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Send, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export default function AppHeader() {
  const { isLoggedIn, login, logout, wallet } = useApp();
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/send", icon: Send, label: "Send" },
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
            <span className="font-display text-lg font-bold text-primary-foreground">P</span>
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Pey<span className="text-gradient">Dot</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <span className="hidden text-xs text-muted-foreground sm:block">
              {wallet.address}
            </span>
          )}
          <button
            onClick={isLoggedIn ? logout : login}
            className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            {isLoggedIn ? (
              <>
                <LogOut className="h-4 w-4" /> Sign Out
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" /> Sign In
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex border-t border-border sm:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

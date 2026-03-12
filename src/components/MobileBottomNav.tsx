import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Home, Send, LayoutDashboard, Users, BarChart3, MessageCircle, MoreHorizontal, Zap, Building2, Wallet, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const primaryItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/send", label: "Send", icon: Send },
  { to: "/whatsapp", label: "Chat", icon: MessageCircle },
];

const moreItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/streaming", label: "Stream", icon: Zap },
  { to: "/organizations", label: "Orgs", icon: Building2 },
  { to: "/request", label: "Request", icon: Wallet },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl xl:hidden">
        <div className="flex items-center justify-around py-2 px-1">
          {primaryItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
            More
          </button>
        </div>
        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* More Menu Dropdown */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-14 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 xl:hidden"
          >
            <div className="flex justify-around">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-medium transition-colors ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

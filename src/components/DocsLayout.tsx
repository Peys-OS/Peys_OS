import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

const navItems = [
  { section: "Getting Started", items: [
    { to: "/docs", label: "Introduction", icon: null },
    { to: "/docs/quickstart", label: "Quick Start", icon: null },
    { to: "/docs/installation", label: "Installation", icon: null },
  ]},
  { section: "Core Concepts", items: [
    { to: "/docs/payments", label: "Payments", icon: null },
    { to: "/docs/claims", label: "Payment Claims", icon: null },
    { to: "/docs/webhooks", label: "Webhooks", icon: null },
  ]},
  { section: "API Reference", items: [
    { to: "/docs/api/authentication", label: "Authentication", icon: null },
    { to: "/docs/api/payments", label: "Payments API", icon: null },
    { to: "/docs/api/webhooks-api", label: "Webhooks API", icon: null },
  ]},
  { section: "SDKs", items: [
    { to: "/docs/sdks/javascript", label: "JavaScript", icon: null },
    { to: "/docs/sdks/python", label: "Python", icon: null },
    { to: "/docs/sdks/go", label: "Go", icon: null },
  ]},
  { section: "Widgets", items: [
    { to: "/docs/widgets/overview", label: "Overview", icon: null },
    { to: "/docs/widgets/pay-button", label: "Pay Button", icon: null },
    { to: "/docs/widgets/payment-form", label: "Payment Form", icon: null },
  ]},
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="flex pt-16">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-4 right-4 z-50 lg:hidden rounded-full bg-primary p-3 shadow-lg"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || location.pathname.startsWith("/docs")) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: sidebarOpen ? 0 : -300 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-72 overflow-y-auto border-r border-border bg-card/50 backdrop-blur-sm lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:w-72 lg:-translate-x-0"
            >
              <nav className="p-4 space-y-6">
                {navItems.map((section) => (
                  <div key={section.section}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.section}
                    </h3>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                              location.pathname === item.to
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            {item.label}
                            {location.pathname === item.to && (
                              <ChevronRight className="ml-auto h-4 w-4" />
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto max-w-5xl px-4 py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

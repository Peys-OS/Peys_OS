import { Link } from "react-router-dom";
import { Github, Twitter, MessageCircle, Code } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 pb-24 sm:py-16 xl:pb-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <img src="/peys_logo_alone.png" alt="Peys" className="h-10 w-10 rounded-lg" />
              <span className="text-base font-semibold text-foreground">Peys</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              The stablecoin payment OS.<br />
              Built on Polkadot Asset Hub.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">
                <Github className="h-3.5 w-3.5" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary">
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 text-xs">
            <div>
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Personal</p>
              <div className="space-y-2.5">
                <Link to="/send" className="block text-muted-foreground transition-colors hover:text-foreground">Send</Link>
                <Link to="/claim/demo" className="block text-muted-foreground transition-colors hover:text-foreground">Claim</Link>
                <Link to="/request" className="block text-muted-foreground transition-colors hover:text-foreground">Request</Link>
                <Link to="/contacts" className="block text-muted-foreground transition-colors hover:text-foreground">Contacts</Link>
                <Link to="/whatsapp" className="block text-muted-foreground transition-colors hover:text-foreground">WhatsApp</Link>
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Organization</p>
              <div className="space-y-2.5">
                <Link to="/batch" className="block text-muted-foreground transition-colors hover:text-foreground">Batch Payroll</Link>
                <Link to="/streaming" className="block text-muted-foreground transition-colors hover:text-foreground">Streaming</Link>
                <Link to="/analytics" className="block text-muted-foreground transition-colors hover:text-foreground">Analytics</Link>
                <Link to="/dashboard" className="block text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold uppercase tracking-widest text-muted-foreground/50">Developers</p>
              <div className="space-y-2.5">
                <Link to="/developers" className="block text-muted-foreground transition-colors hover:text-foreground">REST API</Link>
                <Link to="/developers" className="block text-muted-foreground transition-colors hover:text-foreground">SDKs</Link>
                <Link to="/developers" className="block text-muted-foreground transition-colors hover:text-foreground">Webhooks</Link>
                <Link to="/developers" className="block text-muted-foreground transition-colors hover:text-foreground">Widgets</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-[11px] text-muted-foreground/50">
          © 2025 Peys · Built for the Polkadot Solidity Hackathon · Made with care on Polkadot Hub
        </div>
      </div>
    </footer>
  );
}

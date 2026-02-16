import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <span className="text-sm font-bold text-primary-foreground">P</span>
              </div>
              <span className="text-lg font-semibold text-foreground">PeyDot</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Stablecoin payments for everyone. Built on Polkadot.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Product</h4>
            <div className="space-y-2">
              <Link to="/send" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Send</Link>
              <Link to="/claim/demo" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Claim</Link>
              <Link to="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Resources</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Smart Contract</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Community</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Telegram</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Discord</a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2025 PeyDot. Built for the Polkadot Solidity Hackathon. Made with ❤️ on Polkadot Hub.
        </div>
      </div>
    </footer>
  );
}

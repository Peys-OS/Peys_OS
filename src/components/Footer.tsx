import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary sm:h-8 sm:w-8">
                <span className="text-xs font-bold text-primary-foreground sm:text-sm">P</span>
              </div>
              <span className="text-base font-semibold text-foreground sm:text-lg">Pey</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
              Stablecoin payments for everyone. Built on Polkadot.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Product</h4>
            <div className="space-y-2">
              <Link to="/send" className="block text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm">Send</Link>
              <Link to="/claim/demo" className="block text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm">Claim</Link>
              <Link to="/dashboard" className="block text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm">Dashboard</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Resources</h4>
            <div className="space-y-2">
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm">Documentation</a>
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm">Smart Contract</a>
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm">GitHub</a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Community</h4>
            <div className="space-y-2">
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm">Twitter</a>
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm">Telegram</a>
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm">Discord</a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:mt-10">
          © 2025 Pey. Built for the Polkadot Solidity Hackathon. Made with ❤️ on Polkadot Hub.
        </div>
      </div>
    </footer>
  );
}

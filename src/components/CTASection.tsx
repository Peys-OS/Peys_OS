import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="bg-gradient-section py-24">
      <div className="container mx-auto text-center">
        <h2 className="font-display text-4xl text-foreground sm:text-5xl">
          Start in minutes, not weeks
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Send your first stablecoin payment today. No wallet setup, no seed phrases, no friction.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/send"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
          >
            Send Payment <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/claim/demo"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Try a Claim Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

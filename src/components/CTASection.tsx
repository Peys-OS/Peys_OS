import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="bg-gradient-section py-16 sm:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-2xl text-foreground sm:text-4xl md:text-5xl">
          Start in minutes, not weeks
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:mt-4 sm:text-base">
          Send your first stablecoin payment today. No wallet setup, no seed phrases, no friction.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center">
          <Link
            to="/send"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 sm:w-auto"
          >
            Send Payment <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/claim/demo"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:w-auto"
          >
            Try a Claim Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

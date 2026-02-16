import AppHeader from "@/components/AppHeader";
import HeroSection from "@/components/HeroSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader />
      <HeroSection />

      {/* How it works */}
      <section className="container mx-auto max-w-2xl px-4 py-20">
        <h2 className="mb-10 text-center font-display text-3xl font-bold text-foreground">
          How it works
        </h2>
        <div className="space-y-6">
          {[
            { step: "1", title: "Send with a link", desc: "Choose amount, pick USDC or USDT, and generate a Magic Claim Link. Funds go into secure escrow." },
            { step: "2", title: "Share the link", desc: "Text, email, or QR code — the recipient doesn't need a wallet or crypto knowledge." },
            { step: "3", title: "Recipient claims instantly", desc: "They sign in with email or Google. A wallet is created automatically. One tap to claim." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 rounded-xl bg-gradient-card p-5 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-display font-bold text-primary-foreground">
                {item.step}
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>
          Built for the Polkadot Solidity Hackathon •{" "}
          <span className="text-gradient font-semibold">PeyDot</span> — Payments without friction
        </p>
      </footer>
    </div>
  );
};

export default Index;

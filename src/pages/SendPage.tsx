import AppHeader from "@/components/AppHeader";
import SendPaymentForm from "@/components/SendPaymentForm";

export default function SendPage() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader />
      <SendPaymentForm />
    </div>
  );
}

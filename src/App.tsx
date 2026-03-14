import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "@privy-io/wagmi";
import { config } from "@/lib/wagmi";
import { PrivyAppProvider } from "@/contexts/PrivyContext";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AIChatBubble from "@/components/AIChatBubble";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import SendPage from "./pages/SendPage";
import PublicPaymentPage from "./pages/PublicPaymentPage";
import ClaimPage from "./pages/ClaimPage";
import DashboardPage from "./pages/DashboardPage";
import AssetsPage from "./pages/AssetsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import StreamingPage from "./pages/StreamingPage";
import BatchPage from "./pages/BatchPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import RequestPage from "./pages/RequestPage";
import ContactsPage from "./pages/ContactsPage";
import ProfilePage from "./pages/ProfilePage";
import WhatsAppPage from "./pages/WhatsAppPage";
import DevelopersPage from "./pages/DevelopersPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import NotFound from "./pages/NotFound";
import DocsPage from "./pages/docs/DocsPage";
import QuickStartPage from "./pages/docs/QuickStartPage";
import InstallationPage from "./pages/docs/InstallationPage";
import PaymentsPage from "./pages/docs/PaymentsPage";
import ClaimsPage from "./pages/docs/ClaimsPage";
import WebhooksDocsPage from "./pages/docs/WebhooksPage";
import WebhooksPage from "./pages/WebhooksPage";
import AuthenticationPage from "./pages/docs/AuthenticationPage";
import PaymentsAPIPage from "./pages/docs/PaymentsAPIPage";
import WebhooksAPIPage from "./pages/docs/WebhooksAPIPage";
import JavaScriptSDKPage from "./pages/docs/JavaScriptSDKPage";
import PythonSDKPage from "./pages/docs/PythonSDKPage";
import GoSDKPage from "./pages/docs/GoSDKPage";
import WidgetsOverviewPage from "./pages/docs/WidgetsOverviewPage";
import PayButtonPage from "./pages/docs/PayButtonPage";
import PaymentFormPage from "./pages/docs/PaymentFormPage";
import PricingPage from "./pages/docs/PricingPage";
import SDKPricingPage from "./pages/docs/SDKPricingPage";
import ErrorsPage from "./pages/docs/ErrorsPage";
import SmartContractsPage from "./pages/docs/SmartContractsPage";

const queryClient = new QueryClient();

const App = () => (
  <PrivyAppProvider>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <TooltipProvider>
          <ThemeProvider>
            <AppProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/send" element={<SendPage />} />
                  <Route path="/pay" element={<PublicPaymentPage />} />
                  <Route path="/claim/:id" element={<ClaimPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/assets" element={<AssetsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/streaming" element={<StreamingPage />} />
                  <Route path="/batch" element={<BatchPage />} />
                  <Route path="/request" element={<RequestPage />} />
                  <Route path="/contacts" element={<ContactsPage />} />
                  <Route path="/whatsapp" element={<WhatsAppPage />} />
                  <Route path="/developers" element={<DevelopersPage />} />
                  <Route path="/api-keys" element={<ApiKeysPage />} />
                  <Route path="/organizations" element={<OrganizationsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/docs" element={<DocsPage />} />
                  <Route path="/docs/quickstart" element={<QuickStartPage />} />
                  <Route path="/docs/installation" element={<InstallationPage />} />
                  <Route path="/docs/payments" element={<PaymentsPage />} />
                  <Route path="/docs/claims" element={<ClaimsPage />} />
                  <Route path="/webhooks" element={<WebhooksPage />} />
                  <Route path="/docs/webhooks" element={<WebhooksDocsPage />} />
                  <Route path="/docs/api/authentication" element={<AuthenticationPage />} />
                  <Route path="/docs/api/payments" element={<PaymentsAPIPage />} />
                  <Route path="/docs/api/webhooks-api" element={<WebhooksAPIPage />} />
                  <Route path="/docs/sdks/javascript" element={<JavaScriptSDKPage />} />
                  <Route path="/docs/sdks/python" element={<PythonSDKPage />} />
                  <Route path="/docs/sdks/go" element={<GoSDKPage />} />
                  <Route path="/docs/widgets/overview" element={<WidgetsOverviewPage />} />
                  <Route path="/docs/widgets/pay-button" element={<PayButtonPage />} />
                  <Route path="/docs/widgets/payment-form" element={<PaymentFormPage />} />
                  <Route path="/docs/pricing" element={<PricingPage />} />
                  <Route path="/docs/sdks/pricing" element={<SDKPricingPage />} />
                  <Route path="/docs/api/errors" element={<ErrorsPage />} />
                  <Route path="/docs/smart-contracts" element={<SmartContractsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <AIChatBubble />
                <MobileBottomNav />
              </BrowserRouter>
            </AppProvider>
          </ThemeProvider>
        </TooltipProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </PrivyAppProvider>
);

export default App;

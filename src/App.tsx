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
import { OfflineProvider } from "@/contexts/OfflineContext";
import { SoundProvider } from "@/hooks/useSound";
import { HapticProvider } from "@/hooks/useHaptic";
import { WakeLockProvider } from "@/hooks/useWakeLock";
import { QuickAccessBar, BookmarksList } from "@/hooks/useBookmarks";
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
import EscrowPage from "./pages/EscrowPage";
import CalendarPage from "./pages/CalendarPage";
import VerificationBadgesPage from "./pages/VerificationBadgesPage";
import RecurringPaymentsPage from "./pages/RecurringPaymentsPage";
import TipJarPage from "./pages/TipJarPage";
import TransactionBundlerPage from "./pages/TransactionBundlerPage";
import BlockExplorerPage from "./pages/BlockExplorerPage";
import AddressLabelsPage from "./pages/AddressLabelsPage";
import CashbackPage from "./pages/CashbackPage";
import ApprovalWorkflowPage from "./pages/ApprovalWorkflowPage";
import DisputePage from "./pages/DisputePage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AffiliatePage from "./pages/AffiliatePage";
import MiniGamesPage from "./pages/MiniGamesPage";
import SmartContractPage from "./pages/SmartContractPage";
import GiftCardsPage from "./pages/GiftCardsPage";
import SocialFeedPage from "./pages/SocialFeedPage";
import TimeLockPage from "./pages/TimeLockPage";
import NfcPage from "./pages/NfcPage";
import AccountRecoveryPage from "./pages/AccountRecoveryPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import WhitelabelPage from "./pages/WhitelabelPage";
import TaxReportPage from "./pages/TaxReportPage";
import InvoicePage from "./pages/InvoicePage";
import DonationPage from "./pages/DonationPage";
import SplitBillPage from "./pages/SplitBillPage";
import StatementPage from "./pages/StatementPage";
import PrivacyPage from "./pages/PrivacyPage";
import ReferralPage from "./pages/ReferralPage";
import ReminderPage from "./pages/ReminderPage";
import TemplatesPage from "./pages/TemplatesPage";
import MerchantToolsPage from "./pages/MerchantToolsPage";
import VerificationPage from "./pages/VerificationPage";
import LoyaltyPage from "./pages/LoyaltyPage";
import LimitsPage from "./pages/LimitsPage";
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
import OfflineBanner from "./components/ui/OfflineBanner";
import QuickActionsBar from "./components/QuickActionsBar";

const queryClient = new QueryClient();

const App = () => (
  <PrivyAppProvider>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <TooltipProvider>
          <ThemeProvider>
            <OfflineProvider>
              <SoundProvider>
                <HapticProvider>
                <WakeLockProvider>
                <AppProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <OfflineBanner />
<Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/send" element={<SendPage />} />
                  <Route path="/public" element={<PublicPaymentPage />} />
                  <Route path="/claim/:id" element={<ClaimPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/assets" element={<AssetsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/streaming" element={<StreamingPage />} />
                  <Route path="/batch" element={<BatchPage />} />
                  <Route path="/escrow" element={<EscrowPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/badges" element={<VerificationBadgesPage />} />
                  <Route path="/recurring" element={<RecurringPaymentsPage />} />
                  <Route path="/tipjar" element={<TipJarPage />} />
                  <Route path="/bundle" element={<TransactionBundlerPage />} />
                  <Route path="/explorer" element={<BlockExplorerPage />} />
                  <Route path="/labels" element={<AddressLabelsPage />} />
                  <Route path="/cashback" element={<CashbackPage />} />
                  <Route path="/approvals" element={<ApprovalWorkflowPage />} />
                  <Route path="/disputes" element={<DisputePage />} />
                  <Route path="/subscriptions" element={<SubscriptionPage />} />
                  <Route path="/affiliate" element={<AffiliatePage />} />
                  <Route path="/games" element={<MiniGamesPage />} />
                  <Route path="/contract" element={<SmartContractPage />} />
                  <Route path="/giftcards" element={<GiftCardsPage />} />
                  <Route path="/feed" element={<SocialFeedPage />} />
                  <Route path="/timelock" element={<TimeLockPage />} />
                  <Route path="/nfc" element={<NfcPage />} />
                  <Route path="/account-recovery" element={<AccountRecoveryPage />} />
                  <Route path="/organizations" element={<OrganizationsPage />} />
                  <Route path="/whitelabel" element={<WhitelabelPage />} />
                  <Route path="/tax-report" element={<TaxReportPage />} />
                  <Route path="/invoice" element={<InvoicePage />} />
                  <Route path="/donation" element={<DonationPage />} />
                  <Route path="/split-bill" element={<SplitBillPage />} />
                  <Route path="/statement" element={<StatementPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/referral" element={<ReferralPage />} />
                  <Route path="/budget" element={<ReminderPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/merchant" element={<MerchantToolsPage />} />
                  <Route path="/verification" element={<VerificationPage />} />
                  <Route path="/loyalty" element={<LoyaltyPage />} />
                  <Route path="/limits" element={<LimitsPage />} />
                  <Route path="/request" element={<RequestPage />} />
                  <Route path="/contacts" element={<ContactsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/whatsapp" element={<WhatsAppPage />} />
                  <Route path="/developers" element={<DevelopersPage />} />
                  <Route path="/api-keys" element={<ApiKeysPage />} />
                  <Route path="/docs" element={<DocsPage />} />
                  <Route path="/docs/quickstart" element={<QuickStartPage />} />
                  <Route path="/docs/installation" element={<InstallationPage />} />
                  <Route path="/docs/payments" element={<PaymentsPage />} />
                  <Route path="/docs/claims" element={<ClaimsPage />} />
                  <Route path="/docs/webhooks" element={<WebhooksDocsPage />} />
                  <Route path="/docs/webhooks-api" element={<WebhooksAPIPage />} />
                  <Route path="/docs/api/authentication" element={<AuthenticationPage />} />
                  <Route path="/docs/api/payments" element={<PaymentsAPIPage />} />
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
                <QuickActionsBar />
                <QuickAccessBar onSelect={(url) => window.location.href = url} />
              </BrowserRouter>
            </AppProvider>
                </WakeLockProvider>
              </HapticProvider>
              </SoundProvider>
            </OfflineProvider>
          </ThemeProvider>
        </TooltipProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </PrivyAppProvider>
);

export default App;

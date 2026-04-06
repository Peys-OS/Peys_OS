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
import { lazy, Suspense } from "react";
import ScrollToTop from "@/components/ScrollToTop";
import AIChatBubble from "@/components/AIChatBubble";
import MobileBottomNav from "@/components/MobileBottomNav";

const Index = lazy(() => import("./pages/Index"));
const SendPage = lazy(() => import("./pages/SendPage"));
const PublicPaymentPage = lazy(() => import("./pages/PublicPaymentPage"));
const ClaimPage = lazy(() => import("./pages/ClaimPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const StreamingPage = lazy(() => import("./pages/StreamingPage"));
const BatchPage = lazy(() => import("./pages/BatchPage"));
const EscrowPage = lazy(() => import("./pages/EscrowPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const VerificationBadgesPage = lazy(() => import("./pages/VerificationBadgesPage"));
const RecurringPaymentsPage = lazy(() => import("./pages/RecurringPaymentsPage"));
const TipJarPage = lazy(() => import("./pages/TipJarPage"));
const TransactionBundlerPage = lazy(() => import("./pages/TransactionBundlerPage"));
const BlockExplorerPage = lazy(() => import("./pages/BlockExplorerPage"));
const AddressLabelsPage = lazy(() => import("./pages/AddressLabelsPage"));
const CashbackPage = lazy(() => import("./pages/CashbackPage"));
const ApprovalWorkflowPage = lazy(() => import("./pages/ApprovalWorkflowPage"));
const DisputePage = lazy(() => import("./pages/DisputePage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const AffiliatePage = lazy(() => import("./pages/AffiliatePage"));
const MiniGamesPage = lazy(() => import("./pages/MiniGamesPage"));
const SmartContractPage = lazy(() => import("./pages/SmartContractPage"));
const GiftCardsPage = lazy(() => import("./pages/GiftCardsPage"));
const SocialFeedPage = lazy(() => import("./pages/SocialFeedPage"));
const TimeLockPage = lazy(() => import("./pages/TimeLockPage"));
const NfcPage = lazy(() => import("./pages/NfcPage"));
const AccountRecoveryPage = lazy(() => import("./pages/AccountRecoveryPage"));
const OrganizationsPage = lazy(() => import("./pages/OrganizationsPage"));
const WhitelabelPage = lazy(() => import("./pages/WhitelabelPage"));
const TaxReportPage = lazy(() => import("./pages/TaxReportPage"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
const DonationPage = lazy(() => import("./pages/DonationPage"));
const SplitBillPage = lazy(() => import("./pages/SplitBillPage"));
const StatementPage = lazy(() => import("./pages/StatementPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const BillsPage = lazy(() => import("./pages/BillsPage"));
const FiatWithdrawalPage = lazy(() => import("./pages/FiatWithdrawalPage"));
const ReceiveDepositsPage = lazy(() => import("./pages/ReceiveDepositsPage"));
const BuyCryptoPage = lazy(() => import("./pages/BuyCryptoPage"));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage"));
const QRPaymentsPage = lazy(() => import("./pages/QRPaymentsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const ReminderPage = lazy(() => import("./pages/ReminderPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const MerchantToolsPage = lazy(() => import("./pages/MerchantToolsPage"));
const VerificationPage = lazy(() => import("./pages/VerificationPage"));
const LoyaltyPage = lazy(() => import("./pages/LoyaltyPage"));
const LimitsPage = lazy(() => import("./pages/LimitsPage"));
const QRServicePage = lazy(() => import("./pages/QRServicePage"));
const RoundUpSavingsPage = lazy(() => import("./pages/RoundUpSavingsPage"));
const AutoReceivePage = lazy(() => import("./pages/AutoReceivePage"));
const ClipboardPage = lazy(() => import("./pages/ClipboardPage"));
const BiometricPage = lazy(() => import("./pages/BiometricPage"));
const ScheduledPaymentsPage = lazy(() => import("./pages/ScheduledPaymentsPage"));
const BulkSendPage = lazy(() => import("./pages/BulkSendPage"));
const ImportExportPage = lazy(() => import("./pages/ImportExportPage"));
const QRScannerPage = lazy(() => import("./pages/QRScannerPage"));
const ReceiptPage = lazy(() => import("./pages/ReceiptPage"));
const NetworkGasPage = lazy(() => import("./pages/NetworkGasPage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const HelpFAQPage = lazy(() => import("./pages/HelpFAQPage"));
const WalletAddressPage = lazy(() => import("./pages/WalletAddressPage"));
const WaitingRoomPage = lazy(() => import("./pages/WaitingRoomPage"));
const KeyboardShortcutsPage = lazy(() => import("./pages/KeyboardShortcutsPage"));
const AccessibilityPage = lazy(() => import("./pages/AccessibilityPage"));
const SessionManagementPage = lazy(() => import("./pages/SessionManagementPage"));
const MultiLanguagePage = lazy(() => import("./pages/MultiLanguagePage"));
const WebSocketSettingsPage = lazy(() => import("./pages/WebSocketSettingsPage"));
const CachingPage = lazy(() => import("./pages/CachingPage"));
const RateLimitingPage = lazy(() => import("./pages/RateLimitingPage"));
const GestureControlsPage = lazy(() => import("./pages/GestureControlsPage"));
const UndoFunctionalityPage = lazy(() => import("./pages/UndoFunctionalityPage"));
const VoiceInputPage = lazy(() => import("./pages/VoiceInputPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const PendingTransactionsPage = lazy(() => import("./pages/PendingTransactionsPage"));
const AddressBookPage = lazy(() => import("./pages/AddressBookPage"));
const RequestPage = lazy(() => import("./pages/RequestPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DevelopersPage = lazy(() => import("./pages/DevelopersPage"));
const CrossChainPage = lazy(() => import("./pages/CrossChainPage"));
const MultiChainPage = lazy(() => import("./pages/MultiChainPage"));
const WhatsAppPage = lazy(() => import("./pages/WhatsAppPage"));
const WhatsAppRegisterPage = lazy(() => import("./pages/WhatsAppRegisterPage"));
const WebhooksPage = lazy(() => import("./pages/WebhooksPage"));
const DocsPage = lazy(() => import("./pages/docs/DocsPage"));

const queryClient = new QueryClient();

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <PrivyAppProvider>
          <AppProvider>
            <ThemeProvider>
              <OfflineProvider>
                <SoundProvider>
                  <HapticProvider>
                    <WakeLockProvider>
                      <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                          <ScrollToTop />
                          <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/send" element={<SendPage />} />
                              <Route path="/public" element={<PublicPaymentPage />} />
                              <Route path="/pay" element={<PublicPaymentPage />} />
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
                              <Route path="/history" element={<HistoryPage />} />
                              <Route path="/bills" element={<BillsPage />} />
                              <Route path="/withdraw" element={<FiatWithdrawalPage />} />
                              <Route path="/deposit" element={<ReceiveDepositsPage />} />
                              <Route path="/buy" element={<BuyCryptoPage />} />
                              <Route path="/qr" element={<QRPaymentsPage />} />
                              <Route path="/privacy" element={<PrivacyPage />} />
                              <Route path="/referral" element={<ReferralPage />} />
                              <Route path="/budget" element={<ReminderPage />} />
                              <Route path="/templates" element={<TemplatesPage />} />
                              <Route path="/merchant" element={<MerchantToolsPage />} />
                              <Route path="/verification" element={<VerificationPage />} />
                              <Route path="/loyalty" element={<LoyaltyPage />} />
                              <Route path="/limits" element={<LimitsPage />} />
                              <Route path="/qr-service" element={<QRServicePage />} />
                              <Route path="/roundup" element={<RoundUpSavingsPage />} />
                              <Route path="/auto-receive" element={<AutoReceivePage />} />
                              <Route path="/clipboard" element={<ClipboardPage />} />
                              <Route path="/biometric" element={<BiometricPage />} />
                              <Route path="/scheduled" element={<ScheduledPaymentsPage />} />
                              <Route path="/bulk-send" element={<BulkSendPage />} />
                              <Route path="/import-export" element={<ImportExportPage />} />
                              <Route path="/qr-scanner" element={<QRScannerPage />} />
                              <Route path="/receipt/:id" element={<ReceiptPage />} />
                              <Route path="/network-gas" element={<NetworkGasPage />} />
                              <Route path="/security" element={<SecurityPage />} />
                              <Route path="/help-faq" element={<HelpFAQPage />} />
                              <Route path="/wallet-address" element={<WalletAddressPage />} />
                              <Route path="/waiting-room" element={<WaitingRoomPage />} />
                              <Route path="/keyboard-shortcuts" element={<KeyboardShortcutsPage />} />
                              <Route path="/accessibility" element={<AccessibilityPage />} />
                              <Route path="/sessions" element={<SessionManagementPage />} />
                              <Route path="/language" element={<MultiLanguagePage />} />
                              <Route path="/websocket" element={<WebSocketSettingsPage />} />
                              <Route path="/cache" element={<CachingPage />} />
                              <Route path="/rate-limit" element={<RateLimitingPage />} />
                              <Route path="/gesture-controls" element={<GestureControlsPage />} />
                              <Route path="/undo" element={<UndoFunctionalityPage />} />
                              <Route path="/voice-input" element={<VoiceInputPage />} />
                              <Route path="/notifications" element={<NotificationsPage />} />
                              <Route path="/pending" element={<PendingTransactionsPage />} />
                              <Route path="/address-book" element={<AddressBookPage />} />
                              <Route path="/request" element={<RequestPage />} />
                              <Route path="/contacts" element={<ContactsPage />} />
                              <Route path="/profile" element={<ProfilePage />} />
                              <Route path="/register" element={<RegisterPage />} />
                              <Route path="/developers" element={<DevelopersPage />} />
                              <Route path="/cross-chain" element={<CrossChainPage />} />
                              <Route path="/networks" element={<MultiChainPage />} />
                              <Route path="/whatsapp" element={<WhatsAppPage />} />
                              <Route path="/whatsapp-register" element={<WhatsAppRegisterPage />} />
                              <Route path="/webhooks" element={<WebhooksPage />} />
                              <Route path="/docs" element={<DocsPage />} />
                              <Route path="/docs/:slug" element={<DocsPage />} />
                            </Routes>
                          </Suspense>
                          <MobileBottomNav />
                          <AIChatBubble />
                        </BrowserRouter>
                      </TooltipProvider>
                    </WakeLockProvider>
                  </HapticProvider>
                </SoundProvider>
              </OfflineProvider>
            </ThemeProvider>
          </AppProvider>
        </PrivyAppProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PrivyAppProvider } from "@/contexts/PrivyContext";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AIChatBubble from "@/components/AIChatBubble";
import MobileBottomNav from "@/components/MobileBottomNav";
import Index from "./pages/Index";
import SendPage from "./pages/SendPage";
import ClaimPage from "./pages/ClaimPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import StreamingPage from "./pages/StreamingPage";
import BatchPage from "./pages/BatchPage";
import RequestPage from "./pages/RequestPage";
import ContactsPage from "./pages/ContactsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <PrivyAppProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/send" element={<SendPage />} />
                <Route path="/claim/:id" element={<ClaimPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/streaming" element={<StreamingPage />} />
                <Route path="/batch" element={<BatchPage />} />
                <Route path="/request" element={<RequestPage />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <AIChatBubble />
              <MobileBottomNav />
            </BrowserRouter>
          </AppProvider>
        </PrivyAppProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

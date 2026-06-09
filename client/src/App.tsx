import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WalletProvider } from "@/context/WalletContext";
import NotFound from "@/pages/not-found";
import { LandinHome } from "@/pages/LandinHome";
import { LandingPage } from "@/pages/LandingPage";
import { AdminPage } from "@/pages/AdminPage";
import { DocsPage } from "@/pages/DocsPage";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/app" component={LandinHome} />
      <Route path="/swap" component={LandinHome} />
      <Route path="/rewards" component={LandinHome} />
      <Route path="/vault" component={LandinHome} />
      <Route path="/earn" component={LandinHome} />
      <Route path="/analytics" component={LandinHome} />
      <Route path="/profile" component={LandinHome} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/docs" component={DocsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <AnnouncementBanner />
          </TooltipProvider>
        </WalletProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

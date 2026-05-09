import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";

import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Projects from "@/pages/projects";
import Account from "@/pages/account";
import Explore from "@/pages/explore";
import Templates from "@/pages/templates";
import WorkspaceGuide from "@/pages/workspace-guide";
import ReplitAgent from "@/pages/replit-agent";
import AdvancedFeatures from "@/pages/advanced-features";
import ProFeatures from "@/pages/pro-features";
import FeaturesPage from "@/pages/features";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chat" component={Chat} />
        <Route path="/projects" component={Projects} />
        <Route path="/templates" component={Templates} />
        <Route path="/explore" component={Explore} />
        <Route path="/workspace-guide" component={WorkspaceGuide} />
        <Route path="/replit-agent" component={ReplitAgent} />
        <Route path="/advanced-features" component={AdvancedFeatures} />
        <Route path="/pro-features" component={ProFeatures} />
        <Route path="/features" component={FeaturesPage} />
        <Route path="/account" component={Account} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const isChat = location === "/chat";

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <div className="relative min-h-[100dvh] w-full mx-auto max-w-[480px] bg-background shadow-2xl overflow-hidden sm:border-x border-border">
        <Router />
        {!isChat && <BottomNav />}
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.backgroundColor = "#141414";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppLayout />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

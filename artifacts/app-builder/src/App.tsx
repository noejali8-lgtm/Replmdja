import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { CapabilitiesTour } from "@/components/CapabilitiesTour";
import { AuthProvider } from "@/contexts/AuthContext";

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

import AgentsPage from "@/pages/agents";
import AgentChatPage from "@/pages/agent-chat";
import SwarmPage from "@/pages/swarm";
import MemoryPage from "@/pages/memory";
import WorkersPage from "@/pages/workers";
import PluginsPage from "@/pages/plugins";
import ProvidersPage from "@/pages/providers";
import SecurityPage from "@/pages/security";
import FederationPage from "@/pages/federation";
import GoalPlannerPage from "@/pages/goap";
import McpPage from "@/pages/mcp";
import RufloInstallPage from "@/pages/ruflo-install";
import GodmodeReadmePage from "@/pages/godmode-readme";
import GodmodeLeaderboardPage from "@/pages/godmode-leaderboard";
import JarvisPage from "@/pages/jarvis";
import OpenClawPage from "@/pages/openclaw";
import GeminiPage from "@/pages/gemini";
import LoginPage from "@/pages/login";
import SettingsPage from "@/pages/settings";
import NotificationsPage from "@/pages/notifications";
import ProfilePage from "@/pages/profile";
import PlansPage from "@/pages/plans";
import BountiesPage from "@/pages/bounties";
import HandsPage from "@/pages/hands";
import OpenGravityPage from "@/pages/opengravity";

const queryClient = new QueryClient();

const RUFLO_PAGES = [
  "/agents", "/agent-chat", "/swarm", "/memory", "/workers",
  "/plugins", "/providers", "/security",
  "/federation", "/goap", "/mcp", "/ruflo-install", "/g0dm0d3", "/godmode-leaderboard", "/jarvis",
  "/hands", "/opengravity",
];

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

        {/* RuFlo Agent System */}
        <Route path="/agents" component={AgentsPage} />
        <Route path="/agent-chat" component={AgentChatPage} />
        <Route path="/swarm" component={SwarmPage} />
        <Route path="/memory" component={MemoryPage} />
        <Route path="/workers" component={WorkersPage} />
        <Route path="/plugins" component={PluginsPage} />
        <Route path="/providers" component={ProvidersPage} />
        <Route path="/security" component={SecurityPage} />
        <Route path="/federation" component={FederationPage} />
        <Route path="/goap" component={GoalPlannerPage} />
        <Route path="/mcp" component={McpPage} />
        <Route path="/ruflo-install" component={RufloInstallPage} />
        <Route path="/g0dm0d3" component={GodmodeReadmePage} />
        <Route path="/godmode-leaderboard" component={GodmodeLeaderboardPage} />
        <Route path="/jarvis" component={JarvisPage} />
        <Route path="/openclaw" component={OpenClawPage} />
        <Route path="/gemini" component={GeminiPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/profile/:username" component={ProfilePage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/plans" component={PlansPage} />
        <Route path="/bounties" component={BountiesPage} />
        <Route path="/hands" component={HandsPage} />
        <Route path="/opengravity" component={OpenGravityPage} />

        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const [showTour, setShowTour] = useState(false);

  const isChat = location === "/chat";
  const isRufloPage = RUFLO_PAGES.some(p => location === p || location.startsWith(p + "/"));
  const isFullScreen = ["/notifications", "/profile", "/plans", "/bounties"].some(p => location === p || location.startsWith(p + "/"));
  const hideBottomNav = isChat || isRufloPage || location === "/gemini";

  // Show tour on first visit
  useEffect(() => {
    const seen = localStorage.getItem("ruflo_tour_seen");
    if (!seen) {
      const timer = setTimeout(() => setShowTour(true), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  function closeTour() {
    localStorage.setItem("ruflo_tour_seen", "1");
    setShowTour(false);
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <div className="relative min-h-[100dvh] w-full mx-auto max-w-[480px] bg-background shadow-2xl overflow-hidden sm:border-x border-border">
        <Router />
        {!hideBottomNav && <BottomNav />}
        {showTour && <CapabilitiesTour onClose={closeTour} />}
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
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppLayout />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

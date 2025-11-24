import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Match from "./pages/Match";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <main className="flex-1">
              <div className="sticky top-0 z-40 border-b border-border bg-background">
                <SidebarTrigger className="m-2" />
              </div>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/match/:type" element={<Match />} />
                <Route path="/install" element={<Install />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

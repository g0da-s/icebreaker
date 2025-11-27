import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import EditProfile from "./pages/EditProfile";
import Home from "./pages/Home";
import Match from "./pages/Match";
import Matches from "./pages/Matches";
import Meetings from "./pages/Meetings";
import IceBreaker from "./pages/IceBreaker";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  
  // Routes where BottomNav should be hidden
  const hideBottomNavRoutes = ["/", "/auth", "/profile-setup", "/install", "/auth/callback/google"];
  const shouldShowBottomNav = !hideBottomNavRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/install" element={<Install />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/profile-setup" element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        } />
        <Route path="/edit-profile" element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        } />
        <Route path="/matches" element={
          <ProtectedRoute>
            <Matches />
          </ProtectedRoute>
        } />
        <Route path="/meetings" element={
          <ProtectedRoute>
            <Meetings />
          </ProtectedRoute>
        } />
        <Route path="/meeting/:id/ice-breaker" element={
          <ProtectedRoute>
            <IceBreaker />
          </ProtectedRoute>
        } />
        <Route path="/achievements" element={
          <ProtectedRoute>
            <Achievements />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/match/:type" element={
          <ProtectedRoute>
            <Match />
          </ProtectedRoute>
        } />
        <Route path="/user/:id" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/auth/callback/google" element={<GoogleCalendarCallback />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {shouldShowBottomNav && <BottomNav />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

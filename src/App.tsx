import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import EditProfile from "./pages/EditProfile";
import Home from "./pages/Home";
import Match from "./pages/Match";
import Matches from "./pages/Matches";
import Meetings from "./pages/Meetings";
import IceBreaker from "./pages/IceBreaker";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

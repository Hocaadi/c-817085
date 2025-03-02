import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import TradingPage from '@/pages/TradingPage';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import UserProfilePage from '@/pages/UserProfilePage';
import NotificationsPage from '@/pages/notifications';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ClerkProvider } from "@clerk/clerk-react";
import { TradingProvider } from '@/contexts/TradingContext';
import { ToastProvider } from "@/components/ui/toast";
import WalletBalancesPage from '@/pages/wallet-balances/index';
import DiagnosticPage from '@/pages/wallet-balances/diagnostic';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key")
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
      retry: 1, // Only retry failed requests once by default
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
  },
});

// Determine basename based on environment
const isProduction = import.meta.env.MODE === 'production';
const basename = isProduction ? '/c-817085' : '';

const App = () => {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={basename}>
              <TradingProvider>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<LandingPage />} />
                    <Route path="login/*" element={<LoginPage />} />
                    <Route path="register/*" element={<LoginPage />} />
                    <Route path="dashboard" element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="trading" element={
                      <ProtectedRoute>
                        <TradingPage />
                      </ProtectedRoute>
                    } />
                    <Route path="profile" element={
                      <ProtectedRoute>
                        <UserProfilePage />
                      </ProtectedRoute>
                    } />
                    <Route path="notifications" element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="wallet-balances" element={
                      <ProtectedRoute>
                        <WalletBalancesPage />
                      </ProtectedRoute>
                    } />
                    <Route path="wallet-balances/diagnostic" element={
                      <ProtectedRoute>
                        <DiagnosticPage />
                      </ProtectedRoute>
                    } />
                    <Route path="diagnostic" element={
                      <ProtectedRoute>
                        <DiagnosticPage />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </TradingProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;

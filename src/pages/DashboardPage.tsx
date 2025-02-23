import { Suspense } from "react";
import MarketStats from "@/components/MarketStats";
import CryptoChart from "@/components/CryptoChart";
import PortfolioCard from "@/components/PortfolioCard";
import CryptoList from "@/components/CryptoList";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Loading component for better UX
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Lazy loading components
const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Crypto Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to your portfolio</p>
        </header>
        
        <ErrorBoundary>
          <Suspense fallback={<LoadingComponent />}>
            <MarketStats />
          </Suspense>
        </ErrorBoundary>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <CryptoChart />
              </Suspense>
            </ErrorBoundary>
          </div>
          <div>
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <PortfolioCard />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
        
        <ErrorBoundary>
          <Suspense fallback={<LoadingComponent />}>
            <CryptoList />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default DashboardPage; 
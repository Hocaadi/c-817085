import { Link } from 'react-router-dom';
import { ArrowRight, LineChart, BarChart2 } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            Welcome to Crypto Hub
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Your all-in-one platform for cryptocurrency trading and market analysis
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Crypto Data Card */}
          <Link 
            to="/dashboard" 
            className="glass-card p-6 rounded-lg transition-transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <LineChart className="w-8 h-8 text-primary" />
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Crypto Data</h2>
            <p className="text-muted-foreground">
              Real-time market data, charts, and comprehensive analytics for informed decision making
            </p>
          </Link>

          {/* Trading Card */}
          <Link 
            to="/trading" 
            className="glass-card p-6 rounded-lg transition-transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart2 className="w-8 h-8 text-success" />
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Crypto Trading</h2>
            <p className="text-muted-foreground">
              Advanced trading interface with real-time signals and strategy execution
            </p>
          </Link>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <LineChart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Charts</h3>
              <p className="text-muted-foreground">Advanced charting with multiple timeframes and indicators</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trading Strategies</h3>
              <p className="text-muted-foreground">Custom trading strategies with automated signals</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-warning/20 flex items-center justify-center">
                <LineChart className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Market Analysis</h3>
              <p className="text-muted-foreground">Comprehensive market data and analysis tools</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isLandingPage = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-secondary/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold">
                Crypto Hub
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link 
                  to="/dashboard" 
                  className="text-sm hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/trading" 
                  className="text-sm hover:text-primary transition-colors"
                >
                  Trading
                </Link>
              </div>
            </div>
            
            <div>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-sm hover:text-primary transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 text-sm hover:text-primary transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className={isLandingPage ? '' : 'container mx-auto px-6 py-8'}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 
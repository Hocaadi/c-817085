import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Sidebar } from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);

  if (!isSignedIn && !isPublicRoute) {
    return null; // Protected routes will handle the redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {isSignedIn && !isPublicRoute ? (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
        </div>
      ) : (
        <main>
          <Outlet />
        </main>
      )}
    </div>
  );
} 
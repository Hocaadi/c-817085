import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User, Settings, Menu, Bell } from 'lucide-react';
import { useAuth, useUser, SignOutButton } from '@clerk/clerk-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const isLandingPage = location.pathname === '/';

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
              {isSignedIn && (
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
                  <Link 
                    to="/notifications" 
                    className="text-sm hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Notifications
                  </Link>
                </div>
              )}
            </div>
            
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border border-secondary/20">
                        <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.firstName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-64 mt-2 p-2 bg-background/95 backdrop-blur-sm border border-secondary/20" 
                    align="end"
                  >
                    <div className="flex items-center gap-3 p-2 mb-2">
                      <Avatar className="h-10 w-10 border border-secondary/20">
                        <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.firstName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-secondary/20 my-2" />
                    <DropdownMenuItem 
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-secondary/10 rounded-md transition-colors"
                      onClick={() => navigate('/profile')}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-secondary/10 rounded-md transition-colors"
                      onClick={() => navigate('/settings')}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-secondary/20 my-2" />
                    <SignOutButton>
                      <DropdownMenuItem 
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-destructive/10 text-destructive hover:text-destructive rounded-md transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </SignOutButton>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
      </nav>

      {/* Page Content */}
      <main className={isLandingPage ? '' : 'container mx-auto px-6 py-8'}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 
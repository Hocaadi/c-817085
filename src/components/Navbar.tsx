import { Link } from 'react-router-dom';
import { useAuth, useUser, SignOutButton } from '@clerk/clerk-react';
import { LogOut, User, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  return (
    <nav className="border-b border-secondary/20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold">
              Crypto Hub
            </Link>
          </div>
          
          {isSignedIn && (
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
                  <Link to="/profile">
                    <DropdownMenuItem 
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-secondary/10 rounded-md transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/settings">
                    <DropdownMenuItem 
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-secondary/10 rounded-md transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
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
          )}
        </div>
      </div>
    </nav>
  );
} 
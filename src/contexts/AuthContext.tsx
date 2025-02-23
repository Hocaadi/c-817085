import React, { createContext, useContext, useState, useCallback } from 'react';
import { AuthState, User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: any | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      // For demo purposes, accept any credentials
      setUser({ id: 1, email: credentials.email });
      localStorage.setItem('isAuthenticated', 'true');
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in.',
      });
    } catch (err) {
      setError('Login failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    toast({
      title: 'Logged out',
      description: 'Successfully logged out.',
    });
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
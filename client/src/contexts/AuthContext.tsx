import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User } from '../../../server/src/models/User'; // Adjust path as needed

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  token: string | null;
  login: (userData: Omit<User, 'password'>, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  fetchAndSetUser: () => Promise<void>; // Add this new function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const fetchAndSetUser = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${savedToken}`,
          },
        });

        if (response.ok) {
          const userData: Omit<User, 'password'> = await response.json();
          setUser(userData);
          setToken(savedToken);
          localStorage.setItem('user', JSON.stringify(userData)); // Update local storage with fresh user data
        } else {
          // Token might be invalid or expired, log out the user
          logout();
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      await fetchAndSetUser();
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchAndSetUser]); // Depend on fetchAndSetUser which is memoized

  const login = (userData: Omit<User, 'password'>, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', newToken);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, fetchAndSetUser }}>
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

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage, User } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    // For now, accept any login - try to find existing user or create default admin
    const users = storage.getUsers();
    let foundUser = users.find(u => u.email === email);

    if (!foundUser) {
      // Create a default admin user for any credentials
      foundUser = {
        id: 'temp-user',
        email: email,
        password: password,
        role: 'administrator' as const,
        name: email.split('@')[0] || 'Utilisateur'
      };
    }

    const sessionUser = { ...foundUser };
    setUser(sessionUser);
    storage.setCurrentUser(sessionUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    storage.setCurrentUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { createContext, useContext, useState } from 'react';

// Create Auth Context
export interface CustomerProfile {
  id?: number;
  customerId?: number;
  name?: string;
  email?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  imageUrl?: string;
  balance?: number;
  dateCreated?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  user: CustomerProfile | null;
  setUser: (user: CustomerProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<CustomerProfile | null>(null);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}; 
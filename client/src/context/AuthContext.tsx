import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User } from '../services/api';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'superadmin' | 'admin' | 'customer';
  shopId?: string | null;
  iat?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUser({
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          shopId: decoded.shopId,
        });
        localStorage.setItem('token', token);
      } catch (err) {
        console.error('Invalid token found in storage', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } else {
      setUser(null);
      localStorage.removeItem('token');
    }
    setIsLoading(false);
  }, [token]);

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(newToken);
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        shopId: decoded.shopId,
      });
    } catch (err) {
      console.error('Error decoding login token', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

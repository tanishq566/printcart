import React, { createContext, useContext, useState, useEffect } from 'react';
import { Shop } from '../types';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  shop: Shop | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<Shop>;
  register: (data: any) => Promise<Shop>;
  logout: () => Promise<void>;
  refreshShop: () => Promise<Shop | null>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshShop = async (): Promise<Shop | null> => {
    try {
      const res = await apiFetch<{ shop: Shop }>('/auth/me');
      setShop(res.shop);
      return res.shop;
    } catch {
      setShop(null);
      localStorage.removeItem('printcart_token');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('printcart_token');
    if (token) {
      refreshShop();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier: string, password: string): Promise<Shop> => {
    const res = await apiFetch<{ token: string; shop: Shop }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (res.token) {
      localStorage.setItem('printcart_token', res.token);
    }
    setShop(res.shop);
    return res.shop;
  };

  const register = async (formData: any): Promise<Shop> => {
    const res = await apiFetch<{ token: string; shop: Shop }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (res.token) {
      localStorage.setItem('printcart_token', res.token);
    }
    setShop(res.shop);
    return res.shop;
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('printcart_token');
      setShop(null);
    }
  };

  const isAuthenticated = !!shop;
  const isAdmin = shop?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        shop,
        loading,
        login,
        register,
        logout,
        refreshShop,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

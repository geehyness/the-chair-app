// src/context/AuthContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  username: string; // Display name
  email: string; // Login ID
  phoneNumber?: string;
  role: 'admin' | 'receptionist' | 'barber';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, username: string, role: 'admin' | 'receptionist' | 'barber', phoneNumber?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isReceptionist: boolean;
  isBarber: boolean;
  isAuthReady: boolean; // NEW: State to indicate if auth check is complete
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // Initialize as false
  const router = useRouter();

  useEffect(() => {
    // On mount, try to restore session from cookies
    const storedEmail = Cookies.get('session_email');
    const storedUsername = Cookies.get('session_username');
    const storedPhoneNumber = Cookies.get('session_phoneNumber');
    const storedRole = Cookies.get('user_role');

    if (storedEmail && storedUsername && storedRole) {
      setUser({
        username: storedUsername,
        email: storedEmail,
        phoneNumber: storedPhoneNumber,
        role: storedRole as User['role']
      });
    }
    setIsAuthReady(true); // Mark auth as ready after initial check
  }, []); // Empty dependency array means this runs once on mount

  const login = (email: string, username: string, role: 'admin' | 'receptionist' | 'barber', phoneNumber?: string) => {
    Cookies.set('session_token', 'true', { expires: 7 });
    Cookies.set('session_email', email, { expires: 7 });
    Cookies.set('session_username', username, { expires: 7 });
    if (phoneNumber) Cookies.set('session_phoneNumber', phoneNumber, { expires: 7 });
    Cookies.set('user_role', role, { expires: 7 });
    setUser({ username, email, phoneNumber, role });
  };

  const logout = () => {
    Cookies.remove('session_token');
    Cookies.remove('session_email');
    Cookies.remove('session_username');
    Cookies.remove('session_phoneNumber');
    Cookies.remove('user_role');
    setUser(null);
    router.push('/login');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isReceptionist = user?.role === 'receptionist';
  const isBarber = user?.role === 'barber';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin, isReceptionist, isBarber, isAuthReady }}>
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

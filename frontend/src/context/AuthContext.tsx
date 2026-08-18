import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../types';
import { loginUser, registerUser } from '../services/api';

const STORAGE_KEY = 'vitals_auth_user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  successMessage: string | null;
  setSuccessMessage: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (err) {
        console.warn('Failed to save auth state to localStorage:', err);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (credentials: LoginPayload): Promise<User> => {
    setAuthError(null);
    try {
      const res = await loginUser(credentials);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const errorMsg = typeof detail === 'string'
        ? detail
        : 'Unable to connect to the server. Please try again.';
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const register = async (payload: RegisterPayload): Promise<string> => {
    setAuthError(null);
    try {
      const res = await registerUser(payload);
      const msg = res.message || 'Account created successfully. Please sign in.';
      setSuccessMessage(msg);
      return msg;
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let errorMsg = 'Unable to complete registration. Please try again.';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        errorMsg = detail[0].msg.replace('Value error, ', '');
      }
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    setUser(null);
    setAuthError(null);
    setSuccessMessage(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        authError,
        setAuthError,
        successMessage,
        setSuccessMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

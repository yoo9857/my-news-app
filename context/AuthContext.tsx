'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

// --- Type Definitions ---
// Basic user information available to the client-side
export interface SimpleUser {
  id: number;
  username: string;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: SimpleUser | null;
  token: string | null;
  isLoading: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => void;
}

// --- Context Creation ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- AuthProvider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (currentToken: string) => {
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    
    try {
      // NOTE: We assume NEXT_PUBLIC_ADMIN_API_URL is set in the environment
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/users/me/`, {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });

      if (response.ok) {
        const userData = await response.json();
        // We only store a simplified user object in the context
        setUser({
          id: userData.id,
          username: userData.username,
          avatar_url: userData.profile?.avatar_url, // Assuming profile might be nested
        });
      } else {
        // Token is invalid or expired, clear it
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      // If the API is down, treat as logged out
      localStorage.removeItem('access_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    setToken(storedToken);
    fetchUser(storedToken || '');
  }, [fetchUser]);

  const login = async (accessToken: string) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    await fetchUser(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    // Redirect to home to refresh state cleanly
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook for easy context consumption ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

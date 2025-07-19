'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

// --- Type Definitions ---
export interface SimpleUser {
  id?: string; // NextAuth.js user ID is typically string
  username: string; // Assuming username is available from session
  email: string;
  nickname?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: SimpleUser | null;
  isLoading: boolean;
  login: (provider?: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: (accessToken: string) => Promise<void>;
}

// --- Context Creation ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- AuthProvider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const user: SimpleUser | null = session?.user ? {
    id: session.user.id, // Assuming session.user has an id
    username: session.user.name || session.user.email || '',
    email: session.user.email || '',
    avatar_url: session.user.image,
  } : null;

  const login = async (provider?: string) => {
    await signIn(provider);
  };

  const logout = () => {
    signOut();
  };

  const loginWithGoogle = async (accessToken: string) => {
    try {
      // Here you would typically send the accessToken to your backend
      // for verification and to create a session.
      // For now, we'll simulate a successful login and update the session.
      console.log("Simulating Google login with token:", accessToken);
      // In a real app, you'd make an API call to your backend here
      // const response = await fetch('/api/auth/google-login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ accessToken }),
      // });
      // if (response.ok) {
      //   // Assuming your backend returns user info or a session token
      //   const data = await response.json();
      //   // You might need to manually update the session or re-fetch it
      //   // based on how next-auth handles custom logins.
      //   // For simplicity, we'll just sign in with credentials if your backend supports it
      //   // or trigger a session update.
      //   await signIn('credentials', { ...data, redirect: false });
      // } else {
      //   throw new Error('Google login failed on backend');
      // }
      // For demonstration, we'll just sign in with the google provider
      // IMPORTANT: Ensure your next-auth Google provider is configured to accept an accessToken directly,
      // or implement a custom credentials provider to handle this.
      await signIn("google", { accessToken, redirect: false });

    } catch (error) {
      console.error("Error during Google login:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, loginWithGoogle }}>
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

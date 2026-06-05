"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { AuthTokens } from '@/lib/auth-tokens';
import { AuthState, UserProfile, Role } from '../types/auth';

interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  owner_id: string | null;
  active: boolean;
  phone?: string | null;
  avatar_url?: string | null;
  commission_pct?: number | null;
  default_location_id?: string | null;
  terms_accepted?: boolean;
  onboarding_completed_at?: string | null;
}

function backendToProfile(u: BackendUser): UserProfile {
  return {
    uid: u.id,
    email: u.email,
    displayName: u.name,
    photoURL: u.avatar_url ?? null,
    role: u.role,
    ownerId: u.owner_id ?? u.id,
    createdAt: Date.now(),
    commissionPct: u.commission_pct ?? undefined,
    defaultLocationId: u.default_location_id ?? undefined,
    termsAccepted: u.terms_accepted ?? false,
    onboardingCompletedAt: u.onboarding_completed_at
      ? new Date(u.onboarding_completed_at).getTime()
      : undefined,
  };
}

interface AuthContextType extends AuthState {
  signOut: () => void;
  reloadUser: () => Promise<void>;
  patchUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    try {
      const me = await api.get<BackendUser>('/api/v1/users/me');
      setUser(backendToProfile(me));
    } catch {
      setUser(null);
      AuthTokens.clear();
    }
  }, []);

  useEffect(() => {
    const token = AuthTokens.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    reloadUser().finally(() => setIsLoading(false));
  }, [reloadUser]);

  const signOut = () => {
    AuthTokens.clear();
    setUser(null);
  };

  const patchUser = (updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, signOut, reloadUser, patchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

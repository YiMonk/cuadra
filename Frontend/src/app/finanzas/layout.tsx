"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/context/AuthContext';

export default function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const { isOwner } = useRole();
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !isOwner) {
      router.replace('/pos');
    }
  }, [isOwner, authLoading, router]);

  if (authLoading) return null;
  if (!isOwner) return null;

  return <>{children}</>;
}

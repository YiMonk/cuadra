"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirects handled by AppLayout for cleaner routing
  useEffect(() => {
    if (!isLoading && user) {
      const isGlobalAdmin = user.role === 'admingod' || user.role === 'admin';
      if (isGlobalAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/pos');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="h-full min-h-[80vh] w-full flex flex-col items-center justify-center">
      <div className="w-24 h-24 mb-8 bg-linear-to-tr from-accent-primary to-accent-secondary p-1 rounded-3xl shadow-2xl shadow-accent-primary/20 animate-pulse">
          <div className="w-full h-full bg-ui-bg rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-tr from-accent-primary/20 to-transparent" />
              <ShoppingCart size={32} className="text-accent-primary relative z-10" />
          </div>
      </div>
      <h1 className="text-2xl font-black text-ui-text uppercase tracking-tighter mb-2">Cargando Cuadra...</h1>
      <p className="text-xs text-ui-text-muted font-bold uppercase tracking-widest">Preparando tu espacio de trabajo</p>
    </div>
  );
}

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === 'admingod') {
          router.push('/admin/dashboard');
        } else {
          router.push('/pos');
        }
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="w-20 h-20 mb-6 bg-linear-to-tr from-blue-600 to-teal-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
        <ShoppingCart size={36} color="white" />
      </div>
      <h1 className="text-2xl font-black tracking-tight mb-2">Cargando Cuadra...</h1>
      <p className="text-gray-500 font-medium tracking-wide">Preparando tu espacio de trabajo</p>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { companyService, type CompanyData } from '@/services/companyService';
import CompanyForm from '@/components/admin/CompanyForm';

export default function CreateCompanyPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: solo owner
  useEffect(() => {
    if (!authLoading && user?.role !== 'owner') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleCreateCompany = async (data: CompanyData) => {
    try {
      setLoading(true);
      setError(null);
      const company = await companyService.createCompany(data);
      router.push(`/admin/companies/${company.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear empresa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/admin/companies')}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-black uppercase tracking-widest mb-8 transition-colors"
        >
          <ChevronLeft size={16} />
          Volver
        </button>

        <div className="mb-8">
          <h1 className="text-white font-black text-3xl uppercase tracking-tight mb-2">Nueva empresa</h1>
          <p className="text-white/50 text-sm">Crea una nueva empresa y comienza a gestionar tu negocio</p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="p-8 rounded-2xl border border-white/10 bg-white/5">
          <CompanyForm
            onSubmit={handleCreateCompany}
            loading={loading}
            onCancel={() => router.push('/admin/companies')}
          />
        </div>
      </div>
    </div>
  );
}

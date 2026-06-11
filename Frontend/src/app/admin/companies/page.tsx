"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { companyService, type CompanyOut } from '@/services/companyService';

export default function CompaniesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<CompanyOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard: solo owner
  useEffect(() => {
    if (!authLoading && user?.role !== 'owner') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  // Cargar empresas
  useEffect(() => {
    if (authLoading || user?.role !== 'owner') return;

    loadCompanies();
  }, [authLoading, user]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user?.role === 'owner' && loading)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-white/60 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-white font-black text-3xl uppercase tracking-tight mb-1">Empresas</h1>
            <p className="text-white/50 text-sm">Gestiona todas tus empresas y configuraciones</p>
          </div>
          <button
            onClick={() => router.push('/admin/companies/create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-black font-black uppercase text-xs tracking-widest transition-all duration-200 active:scale-95"
          >
            <Plus size={18} />
            Nueva empresa
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-white/10 bg-white/5">
            <Building2 size={48} className="text-white/20 mb-4" />
            <h3 className="text-white font-black text-lg uppercase mb-2">Sin empresas</h3>
            <p className="text-white/50 text-sm mb-6">Crea tu primera empresa para comenzar</p>
            <button
              onClick={() => router.push('/admin/companies/create')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-black font-black uppercase text-xs tracking-widest transition-all duration-200 active:scale-95"
            >
              <Plus size={18} />
              Crear empresa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => router.push(`/admin/companies/${company.id}`)}
                className="group relative flex flex-col p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-left active:scale-98"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center">
                    <Building2 size={24} className="text-accent-primary" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[9px] font-black uppercase tracking-widest">
                    {company.plan}
                  </span>
                </div>

                <h3 className="text-white font-black text-lg uppercase tracking-tight mb-1">
                  {company.name}
                </h3>

                {company.rif && (
                  <p className="text-white/60 text-xs mb-3">RIF: {company.rif}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {company.modules_enabled.map((mod) => (
                    <span
                      key={mod}
                      className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-widest"
                    >
                      {mod === 'operativo' ? 'Operativo' : mod === 'finanzas' ? 'Finanzas' : mod}
                    </span>
                  ))}
                </div>

                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-auto">
                  Creada: {new Date(company.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

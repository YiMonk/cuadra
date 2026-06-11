"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { AuthTokens } from '@/lib/auth-tokens';
import { decodeJwtPayload } from '@/lib/jwt-decode';
import { companyService, type CompanyOut } from '@/services/companyService';
import { BRAND_ASSETS } from '@/config/brand';

export default function CompanySelectPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { setActiveCompany } = useActiveCompany();

  const [companies, setCompanies] = useState<CompanyOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  // Guard: si el JWT ya tiene cid, redirigir a module-select
  useEffect(() => {
    const token = AuthTokens.getAccess();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const payload = decodeJwtPayload(token);
    if (payload?.cid) {
      // Ya tiene company seleccionada
      router.push('/module-select');
      return;
    }

    // No tiene cid, cargar lista de empresas
    loadCompanies();
  }, [router]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar empresas');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = async (company: CompanyOut) => {
    try {
      setSelecting(company.id);
      setError(null);

      // Llamar a select-company endpoint
      const response = await companyService.selectCompany(company.id);

      // Guardar nuevos tokens
      AuthTokens.set(response.access_token, response.refresh_token);

      // Guardar empresa activa
      setActiveCompany({
        id: company.id,
        name: company.name,
      });

      // Navegar a module-select
      router.push('/module-select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al seleccionar empresa');
      setSelecting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen w-full bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-white/60 text-sm">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  // Sin empresas
  if (companies.length === 0) {
    return (
      <div className="min-h-screen w-full bg-[#080808] relative overflow-hidden flex flex-col items-center justify-center p-6">
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-500/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center gap-8 text-center">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
              <img
                src={BRAND_ASSETS.logo_icon}
                alt="Cuadra"
                className="w-9 h-auto"
              />
            </div>
            <p className="text-white/50 text-xs font-black uppercase tracking-[0.3em]">Sin empresas</p>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-2">
            <h2 className="text-white font-black text-2xl uppercase tracking-tight">Aún no tienes empresas</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Crea tu primera empresa para comenzar a usar Cuadra y gestionar tu negocio.
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push('/admin/companies')}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-black font-black uppercase text-sm tracking-wider transition-all duration-200 active:scale-95"
          >
            <Plus size={18} />
            Crear empresa
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Con empresas
  return (
    <div className="min-h-screen w-full bg-[#080808] relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-500/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center gap-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
            <img
              src={BRAND_ASSETS.logo_icon}
              alt="Cuadra"
              className="w-9 h-auto"
            />
          </div>
          <p className="text-white/50 text-xs font-black uppercase tracking-[0.3em]">Selecciona una empresa</p>
        </div>

        {/* Companies Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelectCompany(company)}
              disabled={selecting !== null}
              className="group relative flex flex-col items-start gap-4 p-6 rounded-[2rem] border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 active:scale-98 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selecting === company.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-black/50">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                </div>
              )}

              <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-accent-primary/20 border border-white/15 group-hover:border-accent-primary/40 flex items-center justify-center transition-all duration-300">
                <Building2 size={24} className="text-white/70 group-hover:text-accent-primary transition-colors duration-300" />
              </div>

              <div className="flex-1">
                <h3 className="text-white font-black text-lg uppercase tracking-tight mb-2">{company.name}</h3>
                {company.rif && (
                  <p className="text-white/60 text-xs mb-2">RIF: {company.rif}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {company.modules_enabled.map((mod) => (
                    <span
                      key={mod}
                      className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-widest"
                    >
                      {mod === 'operativo' ? 'Operativo' : mod === 'finanzas' ? 'Finanzas' : mod}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                Plan: {company.plan}
              </div>
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-md text-center">
            {error}
          </div>
        )}

        {/* Admin link */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin/companies')}
            className="text-white/50 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
          >
            Gestionar empresas
          </button>
        </div>
      </div>
    </div>
  );
}

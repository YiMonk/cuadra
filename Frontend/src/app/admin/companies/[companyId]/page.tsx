"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, MapPin, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { companyService, type CompanyOut, type CompanyData, type LocationOut, type LocationData } from '@/services/companyService';
import CompanyForm from '@/components/admin/CompanyForm';

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const { user, isLoading: authLoading } = useAuth();

  const [company, setCompany] = useState<CompanyOut | null>(null);
  const [locations, setLocations] = useState<LocationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState<LocationData>({ name: '', address: '', phone: '' });
  const [deletingLocation, setDeletingLocation] = useState<string | null>(null);

  // Guard: solo owner
  useEffect(() => {
    if (!authLoading && user?.role !== 'owner') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  // Cargar empresa y sucursales
  useEffect(() => {
    if (authLoading || user?.role !== 'owner') return;
    loadData();
  }, [authLoading, user, companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [companyData, locationsData] = await Promise.all([
        companyService.getCompany(companyId),
        companyService.getLocations(companyId),
      ]);
      setCompany(companyData);
      setLocations(locationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async (data: CompanyData) => {
    try {
      setSavingCompany(true);
      const updated = await companyService.updateCompany(companyId, data);
      setCompany(updated);
      setEditingCompany(false);
    } catch (err) {
      throw err;
    } finally {
      setSavingCompany(false);
    }
  };

  const handleAddLocation = async () => {
    if (!locationForm.name.trim()) {
      setError('El nombre de la sucursal es requerido');
      return;
    }

    try {
      setAddingLocation(true);
      await companyService.createLocation(companyId, locationForm);
      setLocationForm({ name: '', address: '', phone: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear sucursal');
    } finally {
      setAddingLocation(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      setDeletingLocation(locationId);
      await companyService.deleteLocation(companyId, locationId);
      setLocations((prev) => prev.filter((l) => l.id !== locationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar sucursal');
    } finally {
      setDeletingLocation(null);
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

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/admin/companies')}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-black uppercase tracking-widest mb-6 transition-colors"
          >
            <ChevronLeft size={16} />
            Volver
          </button>
          <div className="text-center text-white/50">Empresa no encontrada</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/admin/companies')}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-black uppercase tracking-widest mb-6 transition-colors"
        >
          <ChevronLeft size={16} />
          Volver
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-black text-3xl uppercase tracking-tight mb-1">{company.name}</h1>
            <p className="text-white/50 text-sm">{company.rif && `RIF: ${company.rif}`}</p>
          </div>
          <button
            onClick={() => setEditingCompany(!editingCompany)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-colors"
          >
            <Edit2 size={16} />
            Editar
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Formulario de edición */}
        {editingCompany && (
          <div className="p-6 rounded-lg border border-white/10 bg-white/5 mb-8">
            <h2 className="text-white font-black text-lg uppercase tracking-tight mb-6">Datos generales</h2>
            <CompanyForm
              initialData={company}
              onSubmit={handleUpdateCompany}
              loading={savingCompany}
              onCancel={() => setEditingCompany(false)}
            />
          </div>
        )}

        {/* Resumen de empresa */}
        {!editingCompany && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-1">Plan</p>
              <p className="text-white font-black text-lg uppercase">{company.plan}</p>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-1">Módulos activos</p>
              <div className="flex flex-wrap gap-2">
                {company.modules_enabled.map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-1 rounded-md bg-accent-primary/20 border border-accent-primary/40 text-accent-primary text-[10px] font-black uppercase tracking-widest"
                  >
                    {mod === 'operativo' ? 'Operativo' : mod === 'finanzas' ? 'Finanzas' : mod}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sucursales */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-black text-xl uppercase tracking-tight">Sucursales</h2>
            <button
              onClick={() => setAddingLocation(!addingLocation)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black uppercase text-xs tracking-widest transition-colors"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>

          {/* Formulario agregar sucursal */}
          {addingLocation && (
            <div className="p-4 rounded-lg border border-white/10 bg-white/5 mb-4 space-y-3">
              <input
                type="text"
                placeholder="Nombre de la sucursal"
                value={locationForm.name}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={addingLocation}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/60 text-sm"
              />
              <input
                type="text"
                placeholder="Dirección (opcional)"
                value={locationForm.address}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, address: e.target.value }))}
                disabled={addingLocation}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/60 text-sm"
              />
              <input
                type="tel"
                placeholder="Teléfono (opcional)"
                value={locationForm.phone}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={addingLocation}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/60 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddLocation}
                  disabled={addingLocation}
                  className="flex-1 px-3 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-black font-black uppercase text-xs tracking-widest transition-all disabled:opacity-50"
                >
                  Crear
                </button>
                <button
                  onClick={() => {
                    setAddingLocation(false);
                    setLocationForm({ name: '', address: '', phone: '' });
                  }}
                  disabled={addingLocation}
                  className="px-3 py-2 rounded-lg border border-white/20 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de sucursales */}
          {locations.length === 0 ? (
            <div className="text-center p-8 rounded-lg border border-white/10 bg-white/5">
              <MapPin size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/50 text-sm">Sin sucursales aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="text-white font-black uppercase text-sm">{location.name}</p>
                    {location.address && (
                      <p className="text-white/50 text-xs mt-1">{location.address}</p>
                    )}
                    {location.phone && (
                      <p className="text-white/50 text-xs">{location.phone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    disabled={deletingLocation === location.id}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cuentas de acceso */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-black text-xl uppercase tracking-tight">Cuentas de acceso</h2>
            <button
              onClick={() => router.push(`/admin/companies/${companyId}/access-accounts`)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black uppercase text-xs tracking-widest transition-colors"
            >
              <Users size={16} />
              Ver todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

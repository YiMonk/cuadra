"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Plus, Edit2, Lock, ToggleRight, ToggleLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { companyService, type AccessAccountOut, type AccessAccountData } from '@/services/companyService';
import AccessAccountForm from '@/components/admin/AccessAccountForm';
import ChangePasswordModal from '@/components/admin/ChangePasswordModal';

export default function AccessAccountsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const { user, isLoading: authLoading } = useAuth();

  const [accounts, setAccounts] = useState<AccessAccountOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [passwordModalId, setPasswordModalId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Guard: solo owner
  useEffect(() => {
    if (!authLoading && user?.role !== 'owner') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  // Cargar cuentas
  useEffect(() => {
    if (authLoading || user?.role !== 'owner') return;
    loadAccounts();
  }, [authLoading, user, companyId]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyService.getAccessAccounts(companyId);
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (data: AccessAccountData) => {
    try {
      setSavingId('create');
      await companyService.createAccessAccount(companyId, data);
      setCreating(false);
      await loadAccounts();
    } catch (err) {
      throw err;
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateAccount = async (accountId: string, data: AccessAccountData) => {
    try {
      setSavingId(accountId);
      await companyService.updateAccessAccount(companyId, accountId, data);
      setEditingId(null);
      await loadAccounts();
    } catch (err) {
      throw err;
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleStatus = async (accountId: string, account: AccessAccountOut) => {
    try {
      setTogglingId(accountId);
      await companyService.setAccountStatus(companyId, accountId, !account.active);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setTogglingId(null);
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

  const getRoleLabel = (role: string): string => {
    if (role === 'cashier') return 'Cajero';
    if (role === 'viewer') return 'Solo lectura';
    return role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push(`/admin/companies/${companyId}`)}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-black uppercase tracking-widest mb-6 transition-colors"
        >
          <ChevronLeft size={16} />
          Volver
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-black text-3xl uppercase tracking-tight mb-1">Cuentas de acceso</h1>
            <p className="text-white/50 text-sm">Gestiona usuarios y permisos de tu empresa</p>
          </div>
          <button
            onClick={() => setCreating(!creating)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-black font-black uppercase text-xs tracking-widest transition-all disabled:opacity-50"
            disabled={creating}
          >
            <Plus size={18} />
            Nueva cuenta
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Formulario crear */}
        {creating && (
          <div className="p-6 rounded-lg border border-white/10 bg-white/5 mb-8">
            <h2 className="text-white font-black text-lg uppercase tracking-tight mb-6">Nueva cuenta</h2>
            <AccessAccountForm
              mode="create"
              companyId={companyId}
              onSubmit={handleCreateAccount}
              loading={savingId === 'create'}
              onClose={() => setCreating(false)}
            />
          </div>
        )}

        {/* Lista de cuentas */}
        {accounts.length === 0 ? (
          <div className="text-center p-8 rounded-lg border border-white/10 bg-white/5">
            <p className="text-white/50 text-sm">Sin cuentas de acceso aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-left text-white font-black uppercase text-xs tracking-widest">Nombre</th>
                  <th className="px-6 py-4 text-left text-white font-black uppercase text-xs tracking-widest">Email</th>
                  <th className="px-6 py-4 text-left text-white font-black uppercase text-xs tracking-widest">Rol</th>
                  <th className="px-6 py-4 text-left text-white font-black uppercase text-xs tracking-widest">Módulos</th>
                  <th className="px-6 py-4 text-left text-white font-black uppercase text-xs tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-left text-white font-black uppercase text-xs tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <React.Fragment key={account.id}>
                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-bold">{account.name}</td>
                      <td className="px-6 py-4 text-white/70 text-xs">{account.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                          {getRoleLabel(account.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {account.module_access.map((mod) => (
                            <span
                              key={mod}
                              className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-widest"
                            >
                              {mod === 'operativo' ? 'Op' : mod === 'finanzas' ? 'Fin' : mod}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            account.active
                              ? 'bg-green-500/20 border-green-500/40 text-green-400'
                              : 'bg-red-500/20 border-red-500/40 text-red-400'
                          }`}
                        >
                          {account.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(account.id)}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                            disabled={editingId !== null || savingId !== null}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setPasswordModalId(account.id)}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                            disabled={editingId !== null || savingId !== null}
                            title="Cambiar contraseña"
                          >
                            <Lock size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(account.id, account)}
                            disabled={togglingId !== null || editingId !== null || savingId !== null}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                            title={account.active ? 'Desactivar' : 'Activar'}
                          >
                            {account.active ? (
                              <ToggleRight size={16} />
                            ) : (
                              <ToggleLeft size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Fila de edición */}
                    {editingId === account.id && (
                      <tr className="bg-white/5 border-b border-white/10">
                        <td colSpan={6} className="px-6 py-4">
                          <h3 className="text-white font-black text-sm uppercase tracking-tight mb-4">
                            Editar cuenta
                          </h3>
                          <AccessAccountForm
                            mode="edit"
                            initialData={{
                              name: account.name,
                              email: account.email,
                              role: account.role as 'cashier' | 'viewer',
                              module_access: account.module_access,
                            }}
                            companyId={companyId}
                            onSubmit={(data) => handleUpdateAccount(account.id, data)}
                            loading={savingId === account.id}
                            onClose={() => setEditingId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal cambiar contraseña */}
      {passwordModalId && (
        <ChangePasswordModal
          companyId={companyId}
          accountId={passwordModalId}
          accountEmail={accounts.find((a) => a.id === passwordModalId)?.email || ''}
          onClose={() => setPasswordModalId(null)}
          onSuccess={loadAccounts}
        />
      )}
    </div>
  );
}

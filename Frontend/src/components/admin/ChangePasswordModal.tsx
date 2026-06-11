"use client";

import React, { useState } from 'react';
import { companyService } from '@/services/companyService';

interface ChangePasswordModalProps {
  companyId: string;
  accountId: string;
  accountEmail: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({
  companyId,
  accountId,
  accountEmail,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError('La contraseña es requerida');
      return;
    }

    if (newPassword.length < 8) {
      setError('Mínimo 8 caracteres');
      return;
    }

    try {
      setLoading(true);
      await companyService.setAccountPassword(companyId, accountId, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/10 p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-white font-black text-lg uppercase tracking-tight mb-2">
            Contraseña actualizada
          </h3>
          <p className="text-white/50 text-sm">La contraseña se ha cambiado correctamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="rounded-2xl bg-[#1a1a1a] border border-white/10 p-8 max-w-sm w-full">
        <h2 className="text-white font-black text-lg uppercase tracking-tight mb-2">
          Cambiar contraseña
        </h2>
        <p className="text-white/50 text-xs mb-6">{accountEmail}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-black text-xs uppercase tracking-wide mb-2">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              placeholder="Mínimo 8 caracteres"
            />
            {newPassword && newPassword.length < 8 && (
              <p className="text-red-400 text-xs mt-1">Mínimo 8 caracteres</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !newPassword || newPassword.length < 8}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-black font-black uppercase text-xs tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  Guardando...
                </>
              ) : (
                'Cambiar'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg border border-white/20 text-white font-black uppercase text-xs tracking-wide hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

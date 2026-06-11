"use client";

import React, { useState, useEffect } from 'react';
import { AccessAccountData } from '@/services/companyService';

const AVAILABLE_MODULES = [
  { id: 'operativo', label: 'Operativo' },
  { id: 'finanzas', label: 'Finanzas' },
];

const ROLES = [
  { id: 'cashier', label: 'Cajero' },
  { id: 'viewer', label: 'Solo lectura' },
];

interface AccessAccountFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<AccessAccountData>;
  companyId: string;
  onSubmit: (data: AccessAccountData) => Promise<void>;
  loading: boolean;
  onClose: () => void;
}

export default function AccessAccountForm({
  mode,
  initialData,
  companyId,
  onSubmit,
  loading,
  onClose,
}: AccessAccountFormProps) {
  const [formData, setFormData] = useState<AccessAccountData>({
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    password: '',
    role: initialData?.role ?? 'cashier',
    module_access: initialData?.module_access ?? ['operativo'],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof AccessAccountData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData((prev) => {
      const modules = prev.module_access.includes(moduleId)
        ? prev.module_access.filter((m) => m !== moduleId)
        : [...prev.module_access, moduleId];
      return {
        ...prev,
        module_access: modules,
      };
    });
    if (errors.module_access) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.module_access;
        return newErrors;
      });
    }
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Mínimo 8 caracteres';
      }
    }

    if (!ROLES.some((r) => r.id === formData.role)) {
      newErrors.role = 'Rol inválido';
    }

    if (formData.module_access.length === 0) {
      newErrors.module_access = 'Selecciona al menos un módulo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      const data: AccessAccountData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        module_access: formData.module_access,
      };
      if (mode === 'create' && formData.password) {
        data.password = formData.password;
      }
      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      setErrors((prev) => ({
        ...prev,
        submit: message,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = loading || submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className="block text-white font-black text-sm uppercase tracking-wide mb-2">
          Nombre
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={isDisabled}
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          placeholder="Ej: Juan Pérez"
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-white font-black text-sm uppercase tracking-wide mb-2">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          disabled={isDisabled || mode === 'edit'}
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          placeholder="usuario@ejemplo.com"
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      {/* Contraseña (solo en creación) */}
      {mode === 'create' && (
        <div>
          <label className="block text-white font-black text-sm uppercase tracking-wide mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            disabled={isDisabled}
            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            placeholder="Mínimo 8 caracteres"
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password}</p>
          )}
        </div>
      )}

      {/* Rol */}
      <div>
        <label className="block text-white font-black text-sm uppercase tracking-wide mb-2">
          Rol
        </label>
        <select
          value={formData.role}
          onChange={(e) => handleChange('role', e.target.value)}
          disabled={isDisabled}
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {ROLES.map((role) => (
            <option key={role.id} value={role.id} className="bg-[#1a1a1a]">
              {role.label}
            </option>
          ))}
        </select>
        {errors.role && (
          <p className="text-red-400 text-xs mt-1">{errors.role}</p>
        )}
      </div>

      {/* Módulos */}
      <div>
        <label className="block text-white font-black text-sm uppercase tracking-wide mb-3">
          Módulos asignados
        </label>
        <div className="space-y-2">
          {AVAILABLE_MODULES.map((module) => (
            <label
              key={module.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <input
                type="checkbox"
                checked={formData.module_access.includes(module.id)}
                onChange={() => handleModuleToggle(module.id)}
                disabled={isDisabled}
                className="w-5 h-5 rounded border-white/40 bg-white/10 text-accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-accent-primary"
              />
              <span className="text-white font-black uppercase text-sm tracking-wide">
                {module.label}
              </span>
            </label>
          ))}
        </div>
        {errors.module_access && (
          <p className="text-red-400 text-xs mt-2">{errors.module_access}</p>
        )}
      </div>

      {/* Error general */}
      {errors.submit && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {errors.submit}
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isDisabled}
          className="flex-1 px-4 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-black font-black uppercase text-sm tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar'
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isDisabled}
          className="px-6 py-2.5 rounded-lg border border-white/20 text-white font-black uppercase text-sm tracking-wide hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

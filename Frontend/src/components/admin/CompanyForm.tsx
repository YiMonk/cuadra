"use client";

import React, { useState, useEffect } from 'react';
import { CompanyData } from '@/services/companyService';

const AVAILABLE_MODULES = [
  { id: 'operativo', label: 'Operativo' },
  { id: 'finanzas', label: 'Finanzas' },
];

interface CompanyFormProps {
  initialData?: Partial<CompanyData>;
  onSubmit: (data: CompanyData) => Promise<void>;
  loading: boolean;
  onCancel?: () => void;
}

export default function CompanyForm({
  initialData,
  onSubmit,
  loading,
  onCancel,
}: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyData>({
    name: initialData?.name ?? '',
    rif: initialData?.rif ?? '',
    modules_enabled: initialData?.modules_enabled ?? ['operativo'],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof CompanyData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar error del campo cuando se edita
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
      const modules = prev.modules_enabled.includes(moduleId)
        ? prev.modules_enabled.filter((m) => m !== moduleId)
        : [...prev.modules_enabled, moduleId];
      return {
        ...prev,
        modules_enabled: modules,
      };
    });
    if (errors.modules_enabled) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.modules_enabled;
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.modules_enabled.length === 0) {
      newErrors.modules_enabled = 'Selecciona al menos un módulo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      await onSubmit(formData);
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
          Nombre de la empresa
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={isDisabled}
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          placeholder="Ej: Mi Negocio"
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* RIF */}
      <div>
        <label className="block text-white font-black text-sm uppercase tracking-wide mb-2">
          RIF (opcional)
        </label>
        <input
          type="text"
          value={formData.rif}
          onChange={(e) => handleChange('rif', e.target.value)}
          disabled={isDisabled}
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          placeholder="Ej: J-12345678-9"
        />
      </div>

      {/* Módulos */}
      <div>
        <label className="block text-white font-black text-sm uppercase tracking-wide mb-3">
          Módulos habilitados
        </label>
        <div className="space-y-2">
          {AVAILABLE_MODULES.map((module) => (
            <label
              key={module.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={formData.modules_enabled.includes(module.id)}
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
        {errors.modules_enabled && (
          <p className="text-red-400 text-xs mt-2">{errors.modules_enabled}</p>
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
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isDisabled}
            className="px-6 py-2.5 rounded-lg border border-white/20 text-white font-black uppercase text-sm tracking-wide hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

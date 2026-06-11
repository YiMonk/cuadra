"use client";

import React, { useEffect, useRef } from 'react';
import { ShoppingCart, BarChart2, X } from 'lucide-react';
import type { ActiveModule } from '@/hooks/useActiveModule';

interface ModuleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: ActiveModule;
  onSelect: (module: ActiveModule) => void;
}

const MODULES: {
  id: ActiveModule;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  {
    id: 'operativo',
    name: 'Operativo',
    description: 'Ventas, inventario, clientes, cobros y caja.',
    icon: ShoppingCart,
  },
  {
    id: 'finanzas',
    name: 'Finanzas',
    description: 'Flujo de caja, cuentas, gastos e ingresos.',
    icon: BarChart2,
  },
];

export default function ModuleSwitcherModal({
  isOpen,
  onClose,
  activeModule,
  onSelect,
}: ModuleSwitcherModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-ui-surface border border-ui-border rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Cambiar módulo</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ui-bg transition-colors text-foreground/50 hover:text-foreground"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Module Cards */}
        <div className="px-6 pb-6 space-y-3">
          {MODULES.map(({ id, name, description, icon: Icon }) => {
            const isActive = activeModule === id;
            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-accent-primary bg-accent-primary/10 shadow-sm shadow-accent-primary/20'
                    : 'border-ui-border bg-ui-bg hover:border-accent-primary/40 hover:bg-accent-primary/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/30' : 'bg-ui-surface text-foreground/60'}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black uppercase tracking-wide ${isActive ? 'text-accent-primary' : 'text-foreground'}`}>
                    {name}
                  </p>
                  <p className="text-xs text-foreground/50 mt-0.5 leading-snug">{description}</p>
                </div>
                {isActive && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-primary mt-1.5 shadow-glow-violet animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

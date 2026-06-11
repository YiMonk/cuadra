"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, BarChart2 } from 'lucide-react';
import { useActiveModule, type ActiveModule } from '@/hooks/useActiveModule';
import { BRAND_ASSETS } from '@/config/brand';
import { useAppTheme } from '@/context/ThemeContext';

const MODULES: {
  id: ActiveModule;
  name: string;
  description: string;
  destination: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
}[] = [
  {
    id: 'operativo',
    name: 'Operativo',
    description: 'Ventas, inventario, clientes, cobros y caja.',
    destination: '/pos',
    icon: ShoppingCart,
    colorClass: 'violet',
  },
  {
    id: 'finanzas',
    name: 'Finanzas',
    description: 'Flujo de caja, cuentas, gastos e ingresos.',
    destination: '/finanzas/dashboard',
    icon: BarChart2,
    colorClass: 'fuchsia',
  },
];

export default function ModuleSelectPage() {
  const router = useRouter();
  const { activeModule, setActiveModule } = useActiveModule();
  const { isDarkTheme } = useAppTheme();

  const handleSelect = (mod: ActiveModule, destination: string) => {
    setActiveModule(mod);
    router.push(destination);
  };

  return (
    <div className="min-h-screen w-full bg-[#080808] relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-500/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
            <img
              src={BRAND_ASSETS.logo_icon}
              alt="Cuadra"
              className="w-9 h-auto"
            />
          </div>
          <p className="text-white/50 text-xs font-black uppercase tracking-[0.3em]">Selecciona un módulo</p>
        </div>

        {/* Module cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          {MODULES.map(({ id, name, description, destination, icon: Icon }) => {
            const isLastUsed = id === activeModule;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id, destination)}
                className="group relative flex flex-col items-start gap-4 p-6 rounded-[2rem] border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 active:scale-98 text-left"
              >
                {isLastUsed && (
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-accent-primary/20 border border-accent-primary/40 text-accent-primary text-[9px] font-black uppercase tracking-widest">
                    Ultimo usado
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-accent-primary/20 border border-white/15 group-hover:border-accent-primary/40 flex items-center justify-center transition-all duration-300">
                  <Icon size={24} className="text-white/70 group-hover:text-accent-primary transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg uppercase tracking-tight mb-1">{name}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

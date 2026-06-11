"use client";

import React from 'react';
import { BarChart2 } from 'lucide-react';

export default function FinanzasDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
        <BarChart2 size={40} className="text-accent-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Dashboard Financiero</h1>
        <span className="inline-block px-3 py-1 rounded-full bg-accent-primary/15 border border-accent-primary/30 text-accent-primary text-xs font-black uppercase tracking-widest">
          Proxim­amente
        </span>
      </div>
      <p className="text-sm text-foreground/50 max-w-xs font-medium">
        El dashboard de finanzas estará disponible muy pronto con métricas en tiempo real.
      </p>
    </div>
  );
}

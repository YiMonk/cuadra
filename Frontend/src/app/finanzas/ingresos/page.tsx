"use client";

import React from 'react';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function IngresosPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
        <TrendingUp size={40} className="text-accent-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Ingresos</h1>
        <span className="inline-block px-3 py-1 rounded-full bg-accent-primary/15 border border-accent-primary/30 text-accent-primary text-xs font-black uppercase tracking-widest">
          Proxim­amente
        </span>
      </div>
      <p className="text-sm text-foreground/50 max-w-xs font-medium">
        Consulta y clasifica todos los ingresos de tu negocio.
      </p>
      <Link
        href="/finanzas/dashboard"
        className="mt-2 px-5 py-2.5 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-surface-hover transition-all text-sm font-bold text-foreground/70 hover:text-foreground"
      >
        Volver al dashboard
      </Link>
    </div>
  );
}

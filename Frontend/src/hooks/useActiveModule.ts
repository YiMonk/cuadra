"use client";

import { useState, useCallback } from 'react';

export type ActiveModule = 'operativo' | 'finanzas';

const STORAGE_KEY = 'cuadra_last_module';

function readFromStorage(): ActiveModule | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === 'operativo' || val === 'finanzas') return val;
  return null;
}

export function useActiveModule() {
  const [activeModule, setActiveModuleState] = useState<ActiveModule>(
    () => readFromStorage() ?? 'operativo'
  );

  const setActiveModule = useCallback((module: ActiveModule) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, module);
    }
    setActiveModuleState(module);
  }, []);

  return { activeModule, setActiveModule };
}

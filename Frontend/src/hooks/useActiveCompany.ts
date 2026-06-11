"use client";

import { useState, useCallback } from 'react';

const COMPANY_KEY = 'cuadra_active_company';

export interface ActiveCompany {
  id: string;
  name: string;
}

function readFromStorage(): ActiveCompany | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(COMPANY_KEY);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export function useActiveCompany() {
  const [activeCompany, setActiveCompanyState] = useState<ActiveCompany | null>(
    () => readFromStorage()
  );

  const setActiveCompany = useCallback((company: ActiveCompany) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
    }
    setActiveCompanyState(company);
  }, []);

  const clearActiveCompany = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(COMPANY_KEY);
    }
    setActiveCompanyState(null);
  }, []);

  return { activeCompany, setActiveCompany, clearActiveCompany };
}

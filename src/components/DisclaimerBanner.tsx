"use client";

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export const DisclaimerBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('cuadra_disclaimer_dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('cuadra_disclaimer_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-amber-800">
          <p className="font-semibold mb-1">⚖️ Aviso Legal</p>
          <p className="mb-2">
            Cuadra es una herramienta de gestión empresarial. <strong>No es un sistema fiscal autorizado</strong> y no reemplaza obligaciones legales ni tributarias.
            Tú eres responsable de cumplir con regulaciones de tu jurisdicción.
          </p>
          <a
            href="/disclaimer"
            target="_blank"
            className="text-amber-700 underline hover:text-amber-900 font-medium"
          >
            Ver aviso completo →
          </a>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-600 hover:text-amber-800 flex-shrink-0"
          aria-label="Cerrar aviso"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

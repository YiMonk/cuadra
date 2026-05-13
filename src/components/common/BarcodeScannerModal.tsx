"use client";

import React, { useEffect } from 'react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { X, ScanLine, AlertCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onDetect: (code: string) => void;
}

export function BarcodeScannerModal({ open, onClose, onDetect }: Props) {
  const { videoRef, start, stop, isSupported, isScanning, error } = useBarcodeScanner(code => {
    onDetect(code);
    onClose();
  });

  useEffect(() => {
    if (open) {
      start();
    } else {
      stop();
    }
    return () => stop();
  }, [open, start, stop]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-ui-border">
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-accent-primary" />
            <h2 className="text-sm font-black uppercase tracking-tight text-ui-text">Escanear código</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative bg-black aspect-square">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-accent-primary shadow-[0_0_12px_rgba(124,58,237,0.7)] animate-pulse" />
              <div className="absolute inset-8 border-2 border-accent-primary/30 rounded-2xl" />
            </div>
          )}
          {!isSupported && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div className="space-y-3">
                <AlertCircle size={32} className="mx-auto text-amber-500" />
                <p className="text-xs font-bold text-white">
                  Tu navegador no soporta lectura de códigos de barras.
                </p>
                <p className="text-[10px] text-white/70">
                  Usa Chrome en Android para esta función.
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border-t border-red-500/30 text-[11px] text-red-500 font-bold text-center">
            {error}
          </div>
        )}

        <div className="p-4 text-[10px] font-black text-ui-text-muted uppercase tracking-widest text-center">
          Apunta la cámara al código de barras
        </div>
      </div>
    </div>
  );
}

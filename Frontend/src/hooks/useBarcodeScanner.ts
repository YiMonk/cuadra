"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

// La API BarcodeDetector aún no está en lib.dom estable. Tipamos lo mínimo.
interface DetectedBarcode {
  rawValue: string;
  format: string;
}
interface BarcodeDetectorOptions {
  formats?: string[];
}
interface BarcodeDetectorInstance {
  detect(image: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (options?: BarcodeDetectorOptions): BarcodeDetectorInstance;
  getSupportedFormats(): Promise<string[]>;
}
type WindowWithBarcode = Window & typeof globalThis & { BarcodeDetector?: BarcodeDetectorCtor };

const SUPPORTED_FORMATS = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];

interface UseBarcodeScannerResult {
  isSupported: boolean;
  isScanning: boolean;
  start: () => Promise<void>;
  stop: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
}

/**
 * Hook que usa la BarcodeDetector API nativa del navegador (Chrome/Android).
 * Llama a `onDetect(code)` cuando se detecta un barcode. Auto-detiene la cámara
 * después de cada detección para que el caller decida si reanudar.
 */
export function useBarcodeScanner(onDetect: (code: string) => void): UseBarcodeScannerResult {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as WindowWithBarcode;
    setIsSupported(typeof w.BarcodeDetector === 'function');
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const w = window as WindowWithBarcode;
    if (typeof w.BarcodeDetector !== 'function') {
      setError('Tu navegador no soporta lectura de códigos de barras. Usa Chrome en Android para esta función.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      if (!detectorRef.current) {
        detectorRef.current = new w.BarcodeDetector!({ formats: SUPPORTED_FORMATS });
      }
      setIsScanning(true);

      const loop = async () => {
        if (!videoRef.current || !detectorRef.current) return;
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            stop();
            onDetectRef.current(code);
            return;
          }
        } catch {
          // ignorar frames problemáticos
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al acceder a la cámara';
      setError(msg);
      stop();
    }
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { isSupported, isScanning, start, stop, videoRef, error };
}

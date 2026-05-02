"use client";

import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface TermsAcceptanceModalProps {
  onAccept: () => void;
  isOpen: boolean;
}

export const TermsAcceptanceModal = ({ onAccept, isOpen }: TermsAcceptanceModalProps) => {
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const canAccept = disclaimerChecked && termsChecked && privacyChecked;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white sticky top-0">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Términos y Condiciones</h2>
          </div>
          <p className="text-blue-100">Por favor, revisa y acepta los siguientes documentos antes de continuar</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Disclaimer */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">⚖️</span> Aviso Legal y Disclaimer
            </h3>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Cuadra es una herramienta de gestión empresarial, NO es un sistema fiscal autorizado ni registrado ante el SENIAT.
              Tú eres responsable de cumplir con todas las obligaciones fiscales, tributarias y legales de tu jurisdicción.
              Los registros en Cuadra son internos y no reemplazan documentos fiscales oficiales.
            </p>
            <a
              href="/disclaimer"
              target="_blank"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
            >
              Leer disclaimer completo →
            </a>
            <label className="flex items-center gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={disclaimerChecked}
                onChange={(e) => setDisclaimerChecked(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Entiendo y acepto que Cuadra es solo una herramienta de gestión
              </span>
            </label>
          </div>

          {/* Terms */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">📋</span> Términos de Servicio
            </h3>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Al usar Cuadra, aceptas usar la herramienta solo para fines legales. Eres responsable de tu cuenta,
              datos y cumplimiento de leyes. Cuadra se proporciona "tal cual" sin garantías implícitas.
            </p>
            <a
              href="/terms"
              target="_blank"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
            >
              Leer términos completos →
            </a>
            <label className="flex items-center gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Acepto los Términos de Servicio
              </span>
            </label>
          </div>

          {/* Privacy */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">🔒</span> Política de Privacidad
            </h3>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Tus datos se almacenan en Google Cloud (servidores en EE.UU.). Somos responsables de mantener tu información
              segura bajo PDVD. Tienes derecho a acceso, corrección y eliminación de datos.
            </p>
            <a
              href="/privacy"
              target="_blank"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
            >
              Leer política completa →
            </a>
            <label className="flex items-center gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Entiendo la Política de Privacidad
              </span>
            </label>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>ℹ️ Nota importante:</strong> Si tienes dudas sobre tus obligaciones fiscales o legales,
              consulta con un contador o abogado especializado en tu jurisdicción.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 sticky bottom-0">
          <button
            disabled
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
          >
            No puedo continuar sin aceptar
          </button>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              canAccept
                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            Aceptar y continuar
          </button>
        </div>
      </div>
    </div>
  );
};

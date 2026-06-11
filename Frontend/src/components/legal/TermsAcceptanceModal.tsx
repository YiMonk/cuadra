"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({
  isOpen,
  onAccept,
}) => {
  const [currentTab, setCurrentTab] = useState<'terms' | 'privacy' | 'disclaimer'>('terms');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept();
      toast.success('Términos aceptados');
    } catch (error) {
      console.error('Error accepting terms:', error);
      toast.error('Error al aceptar los términos');
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs = [
    { id: 'terms', label: 'Términos y Condiciones' },
    { id: 'privacy', label: 'Política de Privacidad' },
    { id: 'disclaimer', label: 'Disclaimer' },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-ui-surface border border-ui-border rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-ui-border bg-gradient-to-r from-blue-500/10 to-transparent">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Términos y Condiciones
            </h2>
            <p className="text-gray-400 text-sm mt-1 font-medium">
              Revisa nuestros términos antes de continuar usando CUADRA
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-ui-border px-4 bg-black/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                currentTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 text-sm text-gray-300 leading-relaxed">
          {currentTab === 'terms' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Términos y Condiciones</h3>
              <p>
                Al acceder y utilizar CUADRA, aceptas estar vinculado por estos términos y condiciones.
              </p>
              <h4 className="font-bold text-white mt-4">1. Uso de la Plataforma</h4>
              <p>
                CUADRA es una plataforma de gestión de punto de venta y control de inventario. Te comprometes a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Usar la plataforma únicamente para propósitos legales y autorizados</li>
                <li>No interferir con la operación normal del sistema</li>
                <li>No compartir tus credenciales de acceso con terceros no autorizados</li>
                <li>Responsabilizarte por todas las actividades bajo tu cuenta</li>
              </ul>
              <h4 className="font-bold text-white mt-4">2. Responsabilidades</h4>
              <p>
                Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran en tu cuenta.
                CUADRA no se responsabiliza por pérdidas derivadas del uso no autorizado de tu cuenta.
              </p>
              <h4 className="font-bold text-white mt-4">3. Limitación de Responsabilidad</h4>
              <p>
                La plataforma se proporciona "tal cual". CUADRA no garantiza que el servicio sea ininterrumpido o libre de errores.
                En la máxima medida permitida por la ley, CUADRA no será responsable por daños indirectos o consecuentes.
              </p>
              <h4 className="font-bold text-white mt-4">4. Cambios en los Términos</h4>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la plataforma
                constituye tu aceptación de los términos modificados.
              </p>
            </div>
          )}

          {currentTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Política de Privacidad</h3>
              <p>
                En CUADRA, tu privacidad es importante. Esta política describe cómo recopilamos, usamos y protegemos tu información.
              </p>
              <h4 className="font-bold text-white mt-4">1. Información que Recopilamos</h4>
              <p>Recopilamos la siguiente información:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Información de registro: nombre, correo electrónico, contraseña</li>
                <li>Datos de negocio: productos, ventas, clientes, inventario</li>
                <li>Información de uso: cómo utilizas la plataforma, características accedidas</li>
                <li>Datos técnicos: dirección IP, tipo de navegador, cookies</li>
              </ul>
              <h4 className="font-bold text-white mt-4">2. Cómo Usamos Tu Información</h4>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Comunicarnos contigo sobre actualizaciones y cambios</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Prevenir fraude y garantizar la seguridad de la plataforma</li>
              </ul>
              <h4 className="font-bold text-white mt-4">3. Seguridad de Datos</h4>
              <p>
                Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger tus datos contra acceso,
                alteración o destrucción no autorizada. Esto incluye cifrado, autenticación segura y copias de seguridad regulares.
              </p>
              <h4 className="font-bold text-white mt-4">4. Compartición de Datos</h4>
              <p>
                No compartimos tu información personal con terceros sin tu consentimiento, excepto cuando sea requerido por ley
                o cuando sea necesario para proporcionar nuestros servicios (por ejemplo, proveedores de almacenamiento en la nube).
              </p>
              <h4 className="font-bold text-white mt-4">5. Derechos del Usuario</h4>
              <p>
                Tienes derecho a acceder, corregir o eliminar tu información personal. Contáctanos para ejercer estos derechos.
              </p>
            </div>
          )}

          {currentTab === 'disclaimer' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Disclaimer</h3>
              <p>
                Este disclaimer establece las limitaciones y exclusiones de responsabilidad de CUADRA en relación con el uso de la plataforma.
              </p>
              <h4 className="font-bold text-white mt-4">1. Servicio "TAL CUAL"</h4>
              <p>
                CUADRA se proporciona en estado "tal cual" sin garantías de ningún tipo, expresas o implícitas. No garantizamos que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>El servicio cumpla con tus requisitos específicos</li>
                <li>El servicio sea ininterrumpido, oportuno o libre de errores</li>
                <li>Los resultados obtenidos sean precisos o confiables</li>
              </ul>
              <h4 className="font-bold text-white mt-4">2. Exclusión de Responsabilidad</h4>
              <p>
                En la máxima medida permitida por la ley aplicable, CUADRA no será responsable por ningún daño directo, indirecto,
                incidental, especial, consecuente o punitivo, incluyendo pero no limitado a: pérdida de datos, pérdida de ganancias,
                interrupción del negocio, incluso si hemos sido informados de la posibilidad de tales daños.
              </p>
              <h4 className="font-bold text-white mt-4">3. Límite de Responsabilidad</h4>
              <p>
                La responsabilidad total de CUADRA bajo estos términos no excederá el monto pagado por ti en el último período de
                facturación.
              </p>
              <h4 className="font-bold text-white mt-4">4. Enlaces Externos</h4>
              <p>
                CUADRA puede contener enlaces a sitios web externos. No somos responsables por el contenido de estos sitios ni por
                cualquier transacción realizada a través de ellos.
              </p>
              <h4 className="font-bold text-white mt-4">5. Cambios en el Servicio</h4>
              <p>
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier parte de la plataforma en cualquier momento
                sin previo aviso.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-ui-border bg-black/20 px-8 py-6">
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all"
            size="lg"
            isLoading={isProcessing}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            De acuerdo
          </Button>
        </div>
      </div>
    </div>
  );
};

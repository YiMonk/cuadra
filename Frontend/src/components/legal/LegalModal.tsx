"use client";

import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';

type LegalTab = 'terms' | 'privacy' | 'disclaimer';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept?: () => void;
    initialTab?: LegalTab;
    showAcceptButton?: boolean;
}

export function LegalModal({ isOpen, onClose, onAccept, initialTab = 'terms', showAcceptButton = false }: LegalModalProps) {
    const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

    if (!isOpen) return null;

    const tabs: { id: LegalTab; label: string }[] = [
        { id: 'terms', label: 'Términos y Condiciones' },
        { id: 'privacy', label: 'Política de Privacidad' },
        { id: 'disclaimer', label: 'Disclaimer' }
    ];

    const getContent = () => {
        switch (activeTab) {
            case 'terms':
                return (
                    <div className="space-y-4 text-sm text-ui-text-muted leading-relaxed">
                        <h3 className="text-lg font-black text-ui-text mb-4">Términos y Condiciones</h3>
                        <p>
                            Al utilizar CUADRA, aceptas los siguientes términos y condiciones. Estos términos rigen el acceso y uso de nuestra plataforma de punto de venta y gestión de negocios.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">1. Uso de la Plataforma</h4>
                        <p>
                            CUADRA es una herramienta diseñada para pequeños y medianos empresarios. Tú eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades que ocurran bajo tu cuenta.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">2. Licencia de Uso</h4>
                        <p>
                            Se te otorga una licencia limitada, no exclusiva e intransferible para usar CUADRA según estos términos. No puedes revender, transferir o ceder esta licencia sin nuestra autorización.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">3. Responsabilidad del Usuario</h4>
                        <p>
                            Eres responsable de:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Proporcionar información precisa y completa</li>
                            <li>Mantener actualizados tus datos</li>
                            <li>Cumplir con todas las leyes y regulaciones aplicables</li>
                            <li>No usar la plataforma para actividades ilegales o fraudulentas</li>
                        </ul>
                        <h4 className="font-black text-ui-text mt-6">4. Limitación de Responsabilidad</h4>
                        <p>
                            CUADRA se proporciona "tal cual". No garantizamos disponibilidad continua, seguridad absoluta ni ausencia de errores. No somos responsables por pérdidas de datos, ganancias no realizadas o daños indirectos.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">5. Cambios en los Términos</h4>
                        <p>
                            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entran en vigor inmediatamente. Tu uso continuado significa aceptación de los nuevos términos.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">6. Terminación</h4>
                        <p>
                            Podemos suspender o cancelar tu cuenta si incumples estos términos, realizas actividades fraudulentas o abusas del servicio. Tienes derecho a solicitar la descarga de tus datos antes de la cancelación.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">7. Contacto</h4>
                        <p>
                            Para preguntas sobre estos términos, contáctanos a través de la sección de soporte en la plataforma.
                        </p>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="space-y-4 text-sm text-ui-text-muted leading-relaxed">
                        <h3 className="text-lg font-black text-ui-text mb-4">Política de Privacidad</h3>
                        <p>
                            CUADRA se compromete a proteger tu privacidad. Esta política describe cómo recopilamos, utilizamos y protegemos tu información personal.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">1. Información que Recopilamos</h4>
                        <p>
                            Recopilamos información que tú proporcionas directamente, incluyendo:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Nombre y correo electrónico</li>
                            <li>Datos de negocio (productos, clientes, transacciones)</li>
                            <li>Información de contacto</li>
                            <li>Datos de pago y suscripción</li>
                        </ul>
                        <h4 className="font-black text-ui-text mt-6">2. Cómo Usamos Tu Información</h4>
                        <p>
                            Utilizamos tu información para:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Proporcionar y mejorar nuestros servicios</li>
                            <li>Personalizar tu experiencia</li>
                            <li>Procesar transacciones</li>
                            <li>Enviarte actualizaciones y notificaciones</li>
                            <li>Cumplir con obligaciones legales</li>
                        </ul>
                        <h4 className="font-black text-ui-text mt-6">3. Protección de Datos</h4>
                        <p>
                            Implementamos medidas de seguridad avanzadas para proteger tus datos:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Encriptación de datos en tránsito y reposo</li>
                            <li>Acceso restringido a información personal</li>
                            <li>Auditorías de seguridad regulares</li>
                            <li>Cumplimiento con estándares internacionales</li>
                        </ul>
                        <h4 className="font-black text-ui-text mt-6">4. Compartir Información</h4>
                        <p>
                            No vendemos ni compartimos tu información personal con terceros sin tu consentimiento, excepto cuando:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Es requerido por ley</li>
                            <li>Es necesario para proporcionar nuestros servicios</li>
                            <li>Has dado consentimiento explícito</li>
                        </ul>
                        <h4 className="font-black text-ui-text mt-6">5. Retención de Datos</h4>
                        <p>
                            Retenemos tus datos mientras tu cuenta esté activa. Puedes solicitar la eliminación en cualquier momento contactando a soporte.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">6. Tus Derechos</h4>
                        <p>
                            Tienes derecho a:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Acceder a tus datos personales</li>
                            <li>Corregir información inexacta</li>
                            <li>Solicitar la eliminación de tus datos</li>
                            <li>Oponerme al procesamiento de tus datos</li>
                        </ul>
                        <h4 className="font-black text-ui-text mt-6">7. Cambios en Esta Política</h4>
                        <p>
                            Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos.
                        </p>
                    </div>
                );
            case 'disclaimer':
                return (
                    <div className="space-y-4 text-sm text-ui-text-muted leading-relaxed">
                        <h3 className="text-lg font-black text-ui-text mb-4">Disclaimer (Exención de Responsabilidad)</h3>
                        <p>
                            CUADRA se proporciona "tal cual" sin garantías de ningún tipo, expresas o implícitas. Al usar CUADRA, aceptas estos términos.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">1. Limitación de Garantías</h4>
                        <p>
                            CUADRA no garantiza:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Disponibilidad continua e interrumpida del servicio</li>
                            <li>Exactitud de la información mostrada</li>
                            <li>Cumplimiento con leyes o regulaciones específicas de tu jurisdicción</li>
                            <li>Compatibilidad con sistemas o navegadores específicos</li>
                        </ul>
                        <h4 className="font-black text-ui-text mt-6">2. Limitación de Responsabilidad</h4>
                        <p>
                            Bajo ninguna circunstancia CUADRA será responsable por:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Pérdida de datos o información</li>
                            <li>Pérdida de ingresos o ganancias</li>
                            <li>Daños indirectos, incidentales o consecuentes</li>
                            <li>Cualquier pérdida derivada del uso o incapacidad de usar el servicio</li>
                        </ul>
                        <h4 className="font-black text-ui-text mt-6">3. Ley Aplicable</h4>
                        <p>
                            Esta exención de responsabilidad está sujeta a la ley y jurisdicción del país donde se proporciona el servicio. Cualquier disputa será resuelta según la ley aplicable.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">4. Respaldo de Datos</h4>
                        <p>
                            Es tu responsabilidad mantener copias de seguridad de tus datos. CUADRA intenta mantener copias de seguridad, pero no garantiza recuperación en todos los casos.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">5. Cambios del Servicio</h4>
                        <p>
                            CUADRA se reserva el derecho de modificar, suspender o descontinuar el servicio en cualquier momento, con o sin previo aviso. No somos responsables por cambios, suspensión o discontinuación.
                        </p>
                        <h4 className="font-black text-ui-text mt-6">6. Interpretación</h4>
                        <p>
                            Si alguna parte de este disclaimer es inválida o inaplicable, las demás disposiciones permanecerán en efecto. Nos comprometemos a implementar una cláusula legal válida que tenga efecto similar.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-ui-surface backdrop-blur-2xl border border-ui-border rounded-[2.5rem] shadow-float overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-400">
                {/* Header */}
                <div className="p-8 border-b border-ui-border flex items-center justify-between bg-accent-primary/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-primary flex items-center justify-center text-white shadow-lg shadow-accent-primary/30">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-ui-text uppercase tracking-tighter leading-none">Acuerdos Legales</h2>
                            <p className="text-[10px] text-ui-text-muted font-bold uppercase tracking-[0.2em] mt-1">Información y términos importantes</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-ui-bg border border-ui-border flex items-center justify-center text-ui-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-8 pt-6 border-b border-ui-border flex gap-2 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all pb-4 border-b-2 ${
                                activeTab === tab.id
                                    ? 'text-accent-primary border-b-accent-primary'
                                    : 'text-ui-text-muted border-b-transparent hover:text-ui-text'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {getContent()}
                </div>

                {/* Footer */}
                {showAcceptButton && (
                    <div className="p-8 bg-ui-bg/50 border-t border-ui-border flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-ui-bg border border-ui-border rounded-xl text-ui-text-muted hover:bg-ui-border text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Más Tarde
                        </button>
                        <button
                            onClick={() => {
                                onAccept?.();
                                onClose();
                            }}
                            className="flex-1 py-3 px-4 bg-accent-primary text-white rounded-xl hover:shadow-lg hover:shadow-accent-primary/30 text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Acepto Todo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

import React from 'react';
import { Step, Tip, Warning, Success, Kbd, List } from '@/components/wiki/WikiArticleRenderer';

export default function LoginConfiguracionArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Aprende cómo crear tu cuenta en Cuadra y configura tu información básica para comenzar.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">Registro de Nueva Cuenta</h2>

      <Step number={1} title="Ir a la página de registro">
        Abre tu navegador y ve a <strong>www.cuadra.app/register</strong> o haz clic en{' '}
        <strong>"Crear cuenta"</strong> desde la página de inicio de sesión.
      </Step>

      <Step number={2} title="Completa tu información">
        Ingresa:
        <List
          items={[
            'Tu nombre completo',
            'Tu correo electrónico (será tu usuario)',
            'Una contraseña segura (mínimo 8 caracteres)',
          ]}
        />
      </Step>

      <Step number={3} title="Verifica tu correo">
        Recibirás un correo de confirmación. Abre tu bandeja de entrada y haz clic en el enlace
        de verificación. Si no ves el correo, revisa tu carpeta de spam.
      </Step>

      <Step number={4} title="Completa tu perfil">
        Después de verificar tu correo, serás redirigido a completar información adicional sobre
        tu negocio.
      </Step>

      <Success>Tu cuenta ha sido creada exitosamente. ¡Ahora estás listo para usar Cuadra!</Success>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Configuración Inicial
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Los siguientes pasos te ayudarán a configurar Cuadra para tu negocio:
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        1. Información del Negocio
      </h3>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ve a <strong>Configuración → Información del Negocio</strong> y completa:
      </p>

      <List
        items={[
          'Nombre del negocio',
          'Tipo de negocio (tienda, farmacia, restaurante, etc.)',
          'Ciudad y dirección',
          'Teléfono de contacto',
          'Correo del negocio (opcional)',
        ]}
      />

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        2. Moneda y Formato
      </h3>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Configura la moneda de tu país:
      </p>

      <List
        items={[
          'Selecciona tu moneda (USD, MXN, ARS, etc.)',
          'Elige el idioma de tu preferencia',
          'Define el formato de fecha y hora',
        ]}
      />

      <Tip>
        <strong>Hablamos tu idioma:</strong> Cuadra está disponible en español, inglés y
        portugués. Puedes cambiar el idioma en cualquier momento.
      </Tip>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        3. Métodos de Pago
      </h3>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra soporta los siguientes métodos de pago:
      </p>

      <List
        items={[
          'Efectivo',
          'Transferencia bancaria',
          'Tarjeta de crédito/débito',
          'Billeteras digitales (Apple Pay, Google Pay, etc.)',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Todos estos métodos están habilitados por defecto. Puedes desactivar los que no uses en
        Configuración.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Iniciando Sesión
      </h2>

      <Step number={1} title="Abre la página de login">
        Ve a <strong>www.cuadra.app/login</strong>
      </Step>

      <Step number={2} title="Ingresa tus credenciales">
        Escribe tu correo y contraseña que estableciste durante el registro.
      </Step>

      <Step number={3} title="Haz clic en Ingresar">
        Presiona el botón <strong>"Ingresar"</strong> y serás redirigido a tu dashboard.
      </Step>

      <Warning>
        <strong>¿Olvidaste tu contraseña?</strong> Haz clic en{' '}
        <strong>"¿Olvidaste tu contraseña?"</strong> en la página de login. Te enviaremos un
        enlace para resetearla.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Recuperando tu Cuenta
      </h2>

      <Step number={1} title="Solicita reset de contraseña">
        En la página de login, haz clic en <strong>"¿Olvidaste tu contraseña?"</strong>
      </Step>

      <Step number={2} title="Ingresa tu correo">
        Escribe el correo asociado a tu cuenta.
      </Step>

      <Step number={3} title="Verifica tu correo">
        Recibirás un correo con un enlace para resetear tu contraseña. El enlace expira en 1
        hora.
      </Step>

      <Step number={4} title="Crea una nueva contraseña">
        Haz clic en el enlace y crea una nueva contraseña segura.
      </Step>

      <Tip>
        <strong>Consejos de seguridad:</strong> Usa una contraseña fuerte con mayúsculas,
        minúsculas, números y símbolos. No compartas tu contraseña con nadie.
      </Tip>
    </>
  );
}

import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function FAQ_SeguridadArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        La seguridad de tu cuenta y los datos de tu negocio es una prioridad en Cuadra.
        Aquí encontrarás cómo proteger tu cuenta, gestionar contraseñas y entender cómo
        protegemos tu información.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Seguridad de tu Cuenta
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cómo cambio mi contraseña?
      </h3>

      <Step number={1} title="Ve a tu perfil">
        Haz clic en tu nombre o foto en la parte inferior del menú y selecciona{' '}
        <strong>"Mi Perfil"</strong> o <strong>"Cuenta"</strong>.
      </Step>

      <Step number={2} title="Sección de contraseña">
        Busca la sección <strong>"Seguridad"</strong> o <strong>"Cambiar contraseña"</strong>.
      </Step>

      <Step number={3} title="Ingresa la contraseña actual y la nueva">
        Debes ingresar tu contraseña actual para confirmar que eres tú quien hace el cambio,
        luego escribe la nueva contraseña dos veces.
      </Step>

      <Step number={4} title="Guarda">
        Haz clic en <strong>"Actualizar contraseña"</strong>.
      </Step>

      <Tip>
        <strong>Contraseña fuerte:</strong> Usa al menos 12 caracteres combinando letras
        mayúsculas, minúsculas, números y símbolos. Evita fechas de cumpleaños o palabras
        comunes.
      </Tip>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Qué hago si olvidé mi contraseña?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En la pantalla de login, haz clic en <strong>"¿Olvidaste tu contraseña?"</strong>.
        Recibirás un correo con un enlace para crear una nueva contraseña. El enlace expira
        en 24 horas por seguridad.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cuadra tiene autenticación de dos factores (2FA)?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Puedes activar la verificación en dos pasos en <strong>Perfil → Seguridad → 2FA</strong>.
        Una vez activada, al iniciar sesión necesitarás ingresar un código enviado a tu
        teléfono o email además de tu contraseña.
      </p>

      <Warning>
        <strong>No compartas tu contraseña:</strong> Cada miembro del equipo debe tener
        su propio usuario. Compartir contraseñas impide hacer seguimiento de quién realizó
        cada operación y representa un riesgo de seguridad.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Seguridad de los Datos
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cómo se almacenan mis datos?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Los datos de Cuadra se almacenan en servidores seguros de Google Cloud (Firebase),
        con cifrado en tránsito (HTTPS/TLS) y en reposo. Las copias de seguridad se realizan
        automáticamente.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cuadra puede acceder a los datos de mi negocio?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El acceso a los datos de tu negocio está controlado por las reglas de seguridad
        de la base de datos. Solo los usuarios de tu equipo con los permisos correctos
        pueden ver y modificar los datos de tu negocio.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Sesiones y Acceso
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo ver en qué dispositivos está abierta mi sesión?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Desde <strong>Perfil → Seguridad → Sesiones activas</strong> puedes ver todos los
        dispositivos donde tienes sesión iniciada y cerrarlas remotamente si es necesario.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Qué pasa si alguien más inicia sesión con mi cuenta?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Recibirás una notificación por correo si se detecta un inicio de sesión desde un
        dispositivo o ubicación no reconocida. Desde esa notificación puedes cerrar la
        sesión sospechosa inmediatamente.
      </p>

      <InfoBox>
        <strong>Recomendación al terminar el turno:</strong> Aunque no es obligatorio,
        es buena práctica que los cajeros cierren sesión al terminar su turno, especialmente
        si el dispositivo es compartido. Así el siguiente turno debe autenticarse con
        su propia cuenta.
      </InfoBox>

      <List
        items={[
          'Usa contraseñas únicas para Cuadra (no la misma que en otras apps)',
          'Activa el 2FA para cuentas de administrador y propietario',
          'Revisa regularmente los usuarios activos y desactiva los que ya no trabajan contigo',
          'Exporta y guarda copias de tus datos periódicamente',
        ]}
      />
    </>
  );
}

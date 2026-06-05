import React from 'react';
import { Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function FAQ_SoporteArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Si tienes problemas técnicos o necesitas ayuda para usar Cuadra, estas son las
        formas de obtener soporte y los pasos para resolver los problemas más comunes
        antes de contactar al equipo.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Canales de Soporte
      </h2>

      <List
        items={[
          'Chat en vivo: disponible desde Configuración → Soporte o desde el ícono de ayuda en la app',
          'Correo: soporte@cuadraapp.com — respuesta en menos de 24 horas hábiles',
          'Wiki / Centro de Ayuda: esta misma wiki con guías detalladas de cada módulo',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Problemas Comunes y Soluciones
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        La aplicación está lenta o no responde
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Prueba estos pasos en orden:
      </p>
      <List
        items={[
          '1. Recarga la página (F5 o Ctrl+R)',
          '2. Verifica tu conexión a internet',
          '3. Limpia el caché del navegador (Ctrl+Shift+Delete)',
          '4. Prueba con otro navegador o dispositivo',
          '5. Si el problema persiste, contacta soporte indicando el navegador y dispositivo',
        ]}
      />

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        No puedo iniciar sesión
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Verifica que:
      </p>
      <List
        items={[
          'Estás usando el correo correcto (el que se usó al crear la cuenta)',
          'La contraseña es correcta (prueba con el ojo para ver si la estás escribiendo bien)',
          'No tienes activado el bloqueo de mayúsculas',
          'Si olvidaste la contraseña, usa "¿Olvidaste tu contraseña?" en la pantalla de login',
        ]}
      />

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        El stock no se actualizó después de una venta
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Recarga la página de inventario — los datos se actualizan en tiempo real pero
        a veces la vista necesita un refresh para mostrar los últimos cambios. Si el
        problema persiste, revisa si la venta quedó correctamente confirmada.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        No recibo el correo de invitación al equipo
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Revisa la carpeta de spam o correo no deseado. Si no está ahí, el administrador
        puede reenviar la invitación desde <strong>Equipo → [usuario] → Reenviar invitación</strong>.
      </p>

      <Tip>
        <strong>Antes de contactar soporte:</strong> Revisa la wiki — la mayoría de las
        dudas sobre el funcionamiento de la app están documentadas aquí. Puedes buscar
        con <strong>Ctrl+K</strong> desde cualquier página de la wiki.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Qué Incluir al Contactar Soporte
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Para que el equipo de soporte pueda ayudarte más rápido, incluye:
      </p>

      <List
        items={[
          'Descripción detallada del problema (qué hiciste, qué esperabas que pasara, qué pasó)',
          'Capturas de pantalla o videos del error si es posible',
          'Qué navegador y dispositivo estás usando',
          'Hora aproximada en que ocurrió el problema',
          'Si el error tiene un mensaje específico, cópialo tal cual',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Horario de Soporte
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El soporte por chat en vivo está disponible en días hábiles. Para urgencias
        fuera de horario (como problemas críticos que impiden operar el negocio),
        envía un correo con el asunto <strong>"URGENTE"</strong> al correo de soporte.
      </p>

      <InfoBox>
        <strong>Actualizaciones y novedades:</strong> Cuadra se actualiza regularmente
        con nuevas funcionalidades y mejoras. Las actualizaciones son automáticas —
        no necesitas instalar nada. Puedes ver el historial de cambios en{' '}
        <strong>Configuración → Novedades</strong>.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes sobre el soporte
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El soporte está incluido en el plan?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. El soporte básico por correo y chat está incluido en todos los planes.
        Consulta los detalles de tu plan para conocer el nivel de soporte disponible.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Pueden acceder a mis datos para ayudarme?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        El equipo de soporte puede ver información técnica necesaria para diagnosticar
        problemas (logs de errores, configuración) pero no accede a tus datos de ventas,
        clientes o finanzas sin tu autorización explícita.
      </p>
    </>
  );
}

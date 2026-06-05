import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Configuracion_TemasArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Cuadra te permite personalizar la apariencia de la aplicación. Puedes elegir entre
        modo claro, modo oscuro o seguir automáticamente la preferencia del sistema operativo.
        La apariencia se guarda por usuario y dispositivo.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Cambiar el Tema de la Aplicación
      </h2>

      <Step number={1} title="Accede a la configuración de apariencia">
        Haz clic en tu nombre o foto de perfil en la parte inferior del menú lateral,
        o ve a <strong>Configuración → Apariencia</strong>.
      </Step>

      <Step number={2} title="Selecciona el tema">
        Elige entre las opciones disponibles:
        <List
          items={[
            'Modo claro: fondo blanco, ideal para ambientes con buena iluminación',
            'Modo oscuro: fondo oscuro, reduce la fatiga visual en ambientes con poca luz',
            'Automático: sigue la configuración de tu dispositivo (cambia según la hora del día si el sistema lo tiene configurado)',
          ]}
        />
      </Step>

      <Step number={3} title="El cambio aplica inmediatamente">
        No necesitas guardar ni recargar la página. El tema cambia al instante.
      </Step>

      <Tip>
        <strong>Modo oscuro en caja:</strong> Si tienes el POS en una tienda con iluminación
        tenue o en la noche, el modo oscuro reduce significativamente el cansancio visual
        para los cajeros durante largas jornadas.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preferencia por Usuario
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cada usuario puede tener su propio tema configurado. Si tienes varios cajeros
        usando el mismo dispositivo con distintas cuentas, cada uno verá la aplicación
        con el tema que prefiere.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preferencia por Dispositivo
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        La preferencia de tema se sincroniza con tu cuenta de usuario y aplica en todos
        los dispositivos donde usas Cuadra. Si cambias el tema en el celular, también
        cambiará en la computadora al iniciar sesión.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Configuraciones de Accesibilidad
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Además del tema, en la sección de apariencia puedes encontrar:
      </p>

      <List
        items={[
          'Tamaño del texto: ajusta si el texto se ve muy pequeño en tu pantalla',
          'Contraste alto: aumenta el contraste para mayor legibilidad',
          'Reducir animaciones: útil en dispositivos lentos o para usuarios sensibles al movimiento',
        ]}
      />

      <InfoBox>
        <strong>Modo oscuro en comprobantes:</strong> Los tickets impresos siempre
        se generan con fondo blanco, independientemente del tema seleccionado.
        El tema solo afecta la interfaz de la aplicación, no los documentos generados.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El administrador puede forzar un tema para todos los usuarios?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No actualmente. Cada usuario elige su propio tema. El administrador puede recomendar
        un tema pero no puede imponerlo a los demás.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El tema "Automático" funciona en todos los dispositivos?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. El modo automático detecta la preferencia del sistema operativo (Windows, macOS,
        iOS, Android) y aplica claro u oscuro según corresponda. En sistemas que no tienen
        esta preferencia configurada, se usa el modo claro por defecto.
      </p>
    </>
  );
}

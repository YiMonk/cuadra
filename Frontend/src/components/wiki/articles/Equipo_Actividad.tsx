import React from 'react';
import { Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Equipo_ActividadArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El registro de actividad muestra un historial de las acciones realizadas por cada
        miembro del equipo: ventas registradas, ajustes de inventario, cambios de precios,
        devoluciones y más. Es la herramienta de auditoría para entender qué pasó y quién
        lo hizo.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Acceder al Registro de Actividad
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ve a <strong>Equipo → Actividad</strong> o desde el perfil de un usuario específico
        en la pestaña <strong>"Actividad"</strong>. Los administradores ven la actividad
        de todo el equipo; el personal solo ve la propia.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Qué se Registra Automáticamente
      </h2>

      <List
        items={[
          'Ventas realizadas (número de venta, monto, productos)',
          'Devoluciones procesadas',
          'Apertura y cierre de sesiones de caja',
          'Movimientos manuales de caja (entradas/salidas)',
          'Ajustes de stock en inventario',
          'Creación o edición de productos',
          'Cambios de precios',
          'Registros de gastos',
          'Login y logout del sistema',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Filtrar la Actividad
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes filtrar el registro de actividad por:
      </p>

      <List
        items={[
          'Usuario específico (ver solo las acciones de un cajero determinado)',
          'Tipo de acción (solo ventas, solo ajustes, solo devoluciones)',
          'Rango de fechas',
          'Sucursal (si tienes múltiples locales)',
        ]}
      />

      <Tip>
        <strong>Investigar discrepancias:</strong> Si hay una diferencia en el arqueo de caja
        o un ajuste de inventario inexplicable, el registro de actividad te permite ver exactamente
        quién hizo qué y cuándo, con marca de tiempo precisa.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Actividad por Usuario
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Desde el perfil de cada miembro del equipo puedes ver:
      </p>

      <List
        items={[
          'Total de ventas realizadas en un período',
          'Ticket promedio de sus ventas',
          'Número de devoluciones procesadas',
          'Sesiones de caja abiertas y cerradas',
          'Últimas acciones realizadas (log cronológico)',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Esto es útil para evaluar el desempeño individual y también para calcular comisiones
        si tienes ese sistema configurado.
      </p>

      <InfoBox>
        <strong>Privacidad del equipo:</strong> El personal solo puede ver su propia actividad.
        Un cajero no puede ver las ventas de sus compañeros. Solo los administradores y
        propietarios tienen visibilidad de la actividad de todo el equipo.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Por cuánto tiempo se conserva el historial de actividad?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra mantiene el historial completo de actividad sin límite de tiempo mientras
        la cuenta esté activa. Nada se borra automáticamente.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Se puede eliminar una entrada del registro de actividad?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        No. El registro de actividad es inmutable para garantizar integridad en la auditoría.
        Esto protege tanto al negocio como al personal de disputas sobre quién realizó qué acción.
      </p>
    </>
  );
}

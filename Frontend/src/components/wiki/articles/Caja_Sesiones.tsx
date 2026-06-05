import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Caja_SesionesArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Las sesiones de caja te permiten controlar el dinero en efectivo de cada turno de trabajo.
        Cada vez que un cajero empieza a atender, abre una sesión; al terminar, la cierra con un
        arqueo. Esto garantiza trazabilidad completa del efectivo.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        ¿Qué es una Sesión de Caja?
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Una sesión de caja es un período de tiempo delimitado durante el cual se registran todas
        las operaciones en efectivo: ventas, retiros, entradas y el cierre final con arqueo.
      </p>

      <List
        items={[
          'Registra todas las ventas realizadas durante el turno',
          'Controla entradas y salidas de efectivo fuera de ventas',
          'Permite comparar el dinero esperado vs el dinero real al cierre',
          'Genera historial por cajero y por turno para auditorías',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Abrir una Sesión de Caja
      </h2>

      <Step number={1} title="Ve a Caja">
        En el menú lateral, haz clic en <strong>Caja</strong>. Si no hay una sesión activa,
        verás el botón <strong>"Abrir Caja"</strong>.
      </Step>

      <Step number={2} title="Ingresa el monto inicial">
        Escribe cuánto efectivo hay en la caja al inicio del turno (el "fondo de caja").
        Este monto es el punto de partida para el arqueo final.
      </Step>

      <Step number={3} title="Confirma la apertura">
        Haz clic en <strong>"Abrir Sesión"</strong>. A partir de este momento, todas las
        ventas en efectivo quedan registradas en esta sesión.
      </Step>

      <Tip>
        <strong>Fondo de caja:</strong> Define un monto inicial estándar para cada turno
        (por ejemplo, $50.000 para dar vueltos). Esto facilita comparar cierres entre días.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Cerrar una Sesión de Caja
      </h2>

      <Step number={1} title="Accede al cierre">
        Con la sesión abierta, haz clic en <strong>"Cerrar Caja"</strong> o{' '}
        <strong>"Cerrar Sesión"</strong>.
      </Step>

      <Step number={2} title="Cuenta el efectivo real">
        Antes de confirmar, cuenta físicamente todo el dinero en la caja.
      </Step>

      <Step number={3} title="Ingresa el monto contado">
        Escribe el total de efectivo que contaste. Cuadra calculará automáticamente si hay
        diferencia (faltante o sobrante) comparando con lo esperado.
      </Step>

      <Step number={4} title="Confirma el cierre">
        Haz clic en <strong>"Cerrar Sesión"</strong>. Se genera el informe de cierre con
        el resumen de ventas, ingresos, egresos y diferencia.
      </Step>

      <Warning>
        <strong>Diferencias en el cierre:</strong> Si el monto contado no coincide con
        el esperado, Cuadra registra la diferencia. Investiga antes de confirmar: un
        billete olvidado o una venta no registrada puede explicar la discrepancia.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ver Sesiones Anteriores
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En <strong>Caja → Historial</strong> puedes revisar todas las sesiones pasadas con:
      </p>

      <List
        items={[
          'Fecha y hora de apertura y cierre',
          'Nombre del cajero que abrió la sesión',
          'Monto inicial y monto final contado',
          'Total de ventas registradas en la sesión',
          'Diferencia (faltante o sobrante)',
        ]}
      />

      <InfoBox>
        <strong>Múltiples cajeros:</strong> Cuadra soporta varias sesiones de caja abiertas
        simultáneamente. Cada cajero puede tener su propia sesión, lo que facilita el control
        individual por turno o por caja física.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo tener varias sesiones abiertas al mismo tiempo?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Si tienes múltiples cajeros o cajas físicas, cada uno puede tener su propia sesión
        activa al mismo tiempo.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Qué pasa si olvido cerrar la sesión?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        La sesión permanece abierta. Un administrador puede cerrarla manualmente desde el
        historial de sesiones.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Las ventas con tarjeta también se incluyen?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. Todas las ventas del período aparecen en la sesión, pero el arqueo de efectivo
        solo considera los pagos en cash. Los pagos electrónicos se muestran como información
        separada.
      </p>
    </>
  );
}

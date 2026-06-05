import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Caja_MovimientosArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Los movimientos de caja son operaciones de efectivo que no corresponden a ventas:
        retiros para gastos, entradas de cambio, depósitos bancarios. Registrarlos correctamente
        mantiene el arqueo exacto y el historial limpio.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Tipos de Movimientos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra distingue dos tipos de movimientos manuales de caja:
      </p>

      <List
        items={[
          'Entrada de efectivo: dinero que entra a la caja sin ser una venta (ej: reposición de fondo)',
          'Salida de efectivo: dinero que sale de la caja sin ser una compra registrada (ej: pago de servicio, retiro para depósito bancario)',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Registrar una Salida de Efectivo
      </h2>

      <Step number={1} title="Abre el menú de movimientos">
        Con una sesión de caja activa, busca el botón <strong>"Movimiento"</strong> o{' '}
        <strong>"Retiro"</strong> en la pantalla de caja.
      </Step>

      <Step number={2} title="Selecciona el tipo">
        Elige <strong>"Salida"</strong> o <strong>"Egreso"</strong>.
      </Step>

      <Step number={3} title="Ingresa el monto y motivo">
        Escribe el monto y selecciona o escribe el motivo: "Pago servicio", "Depósito bancario",
        "Compra insumos", etc.
      </Step>

      <Step number={4} title="Confirma">
        Haz clic en <strong>"Registrar"</strong>. El monto se descuenta del efectivo esperado
        en la caja y queda en el historial de la sesión.
      </Step>

      <Tip>
        <strong>Siempre documenta el motivo:</strong> Un retiro sin motivo es imposible de
        auditar. "Gastos varios" no es suficiente — escribe exactamente para qué fue el dinero.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Registrar una Entrada de Efectivo
      </h2>

      <Step number={1} title="Selecciona entrada">
        En el menú de movimientos, elige <strong>"Entrada"</strong> o{' '}
        <strong>"Ingreso de efectivo"</strong>.
      </Step>

      <Step number={2} title="Ingresa monto y motivo">
        Escribe el monto y el motivo: "Reposición de fondo", "Cambio de billete", etc.
      </Step>

      <Step number={3} title="Confirma">
        Haz clic en <strong>"Registrar"</strong>. El monto se suma al efectivo esperado.
      </Step>

      <Warning>
        <strong>No uses entradas para corregir arqueos:</strong> Si hay un faltante en
        el arqueo, no lo "corrijas" registrando una entrada falsa. Registra la diferencia
        real y anota la observación correspondiente.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ver el Historial de Movimientos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes revisar todos los movimientos de una sesión desde dos lugares:
      </p>

      <List
        items={[
          'Dentro de la sesión activa: ve a la pantalla de caja y busca "Ver movimientos"',
          'En el historial: ve a Caja → Historial, abre una sesión cerrada y revisa sus movimientos',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Cada movimiento muestra: tipo (entrada/salida), monto, motivo, hora y quién lo registró.
      </p>

      <InfoBox>
        <strong>Integración con gastos:</strong> Si registras un pago de gasto directamente
        desde el módulo de <strong>Gastos</strong>, Cuadra puede registrar automáticamente
        el movimiento de salida en la sesión de caja activa, evitando doble trabajo.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo eliminar un movimiento registrado?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No. Los movimientos de caja son permanentes para mantener integridad en la auditoría.
        Si registraste un movimiento por error, registra el movimiento inverso con el motivo
        "Corrección de error".
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cuántos movimientos puedo registrar por sesión?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        No hay límite. Puedes registrar todos los movimientos necesarios durante una sesión.
      </p>
    </>
  );
}

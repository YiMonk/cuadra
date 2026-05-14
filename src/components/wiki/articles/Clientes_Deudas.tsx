import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Clientes_DeudasArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El sistema de deudas (fiado o crédito) de Cuadra te permite venderle a clientes
        sin cobrar en el momento y llevar un registro exacto de cuánto te debe cada uno.
        Así evitas anotar en papeles o libretas que se pierden.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Vender a Crédito (Fiado)
      </h2>

      <Step number={1} title="Crea la venta normalmente en el POS">
        Agrega los productos al carrito como en cualquier venta.
      </Step>

      <Step number={2} title="Asigna el cliente">
        Antes de cobrar, selecciona o busca el cliente al que le vas a fiar. Si no existe,
        créalo en el momento.
      </Step>

      <Step number={3} title="Selecciona 'Crédito' como método de pago">
        En la pantalla de cobro, elige el método <strong>"Crédito"</strong> o{' '}
        <strong>"Fiado"</strong>. La venta quedará registrada como deuda pendiente.
      </Step>

      <Step number={4} title="Confirma la venta">
        Haz clic en <strong>"Confirmar"</strong>. La deuda queda registrada en el perfil
        del cliente.
      </Step>

      <Tip>
        <strong>Límite de crédito:</strong> Puedes definir un monto máximo de crédito por
        cliente. Cuadra te alertará si intentas superar ese límite al registrar una venta
        a crédito.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Registrar un Pago de Deuda
      </h2>

      <Step number={1} title="Abre el perfil del cliente">
        Ve a <strong>Clientes</strong>, busca el cliente y ábrelo.
      </Step>

      <Step number={2} title="Ve a la sección de deudas">
        En el perfil del cliente, busca la pestaña <strong>"Deudas"</strong> o{' '}
        <strong>"Cuenta corriente"</strong>.
      </Step>

      <Step number={3} title="Haz clic en 'Registrar Pago'">
        Encontrarás el botón junto a cada deuda pendiente o un botón general para
        abonar a la cuenta.
      </Step>

      <Step number={4} title="Ingresa el monto pagado">
        Escribe cuánto pagó el cliente. Puede ser el total de la deuda o un abono parcial.
        Selecciona el método de pago (efectivo, transferencia, etc.).
      </Step>

      <Step number={5} title="Confirma el pago">
        Haz clic en <strong>"Registrar Pago"</strong>. La deuda se reduce o se cancela
        según el monto ingresado.
      </Step>

      <Warning>
        <strong>Abonos parciales:</strong> Si el cliente paga solo una parte, la deuda
        restante continúa activa. Cuadra mantiene el historial completo de abonos para
        que puedas ver cuánto ha pagado y cuánto queda.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ver el Estado de las Deudas
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Tienes dos formas de ver las deudas:
      </p>

      <List
        items={[
          'Por cliente: abre su perfil y ve a la pestaña "Deudas" para ver su cuenta corriente',
          'Vista general: ve a Clientes → Deudas para ver todos los clientes con saldo pendiente',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        La vista general muestra el total adeudado por cada cliente y la fecha de la última
        compra/pago, ordenando por monto mayor para priorizar cobros.
      </p>

      <InfoBox>
        <strong>Reporte de deudas:</strong> Desde <strong>Reportes → Clientes</strong>
        puedes generar un informe de todas las cuentas por cobrar para un período determinado,
        útil para tu flujo de caja y seguimiento de cobros.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo vender a crédito sin límite?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Por defecto sí. Pero puedes configurar un límite de crédito por cliente en su perfil
        para que Cuadra te avise o bloquee ventas cuando se supere ese límite.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Se puede imprimir el estado de cuenta de un cliente?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Desde el perfil del cliente, busca la opción de imprimir o exportar su estado
        de cuenta, que muestra todas las compras y pagos con fechas y montos.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Qué pasa con las deudas al eliminar un cliente?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        No puedes eliminar un cliente que tiene deudas pendientes. Primero debes saldar
        o cancelar todas sus deudas.
      </p>
    </>
  );
}

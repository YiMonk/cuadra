import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function POS_DevolucionesArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Las devoluciones permiten revertir total o parcialmente una venta: devolverle dinero
        al cliente y reponer el stock. Cuadra registra automáticamente el movimiento para
        que tu inventario y contabilidad estén siempre correctos.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Procesar una Devolución
      </h2>

      <Step number={1} title="Encuentra la venta original">
        Ve a <strong>Ventas</strong> o busca la venta desde el historial del cliente.
        También puedes buscarla por número de boleta/ticket.
      </Step>

      <Step number={2} title="Abre el detalle de la venta">
        Haz clic en la venta para ver sus detalles completos.
      </Step>

      <Step number={3} title="Haz clic en 'Devolver'">
        Busca el botón <strong>"Procesar Devolución"</strong> o <strong>"Devolver"</strong>
        en la parte inferior del detalle de la venta.
      </Step>

      <Step number={4} title="Selecciona qué devolver">
        Elige si devuelves toda la venta o solo algunos productos. Si es parcial, ingresa
        la cantidad a devolver de cada producto.
      </Step>

      <Step number={5} title="Selecciona el método de reembolso">
        Elige cómo le devuelves el dinero al cliente:
        <List
          items={[
            'Efectivo: devuelves cash de la caja',
            'Crédito en cuenta: se abona a la cuenta del cliente para futuras compras',
            'Transferencia: coordinas el reembolso externamente',
          ]}
        />
      </Step>

      <Step number={6} title="Confirma la devolución">
        Haz clic en <strong>"Confirmar Devolución"</strong>. El stock se repone automáticamente
        y el movimiento queda registrado.
      </Step>

      <Tip>
        <strong>Crédito en cuenta:</strong> Si el cliente quiere cambiar el producto por otro,
        usa "Crédito en cuenta" como reembolso y luego aplícalo como método de pago en la
        nueva venta. Es la forma más ágil de gestionar cambios.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Qué Ocurre al Procesar una Devolución
      </h2>

      <List
        items={[
          'El stock de los productos devueltos se repone automáticamente',
          'La venta original queda marcada como "devuelta" (total o parcialmente)',
          'Se genera un comprobante de devolución con número propio',
          'El monto se registra en el flujo de caja del turno',
          'Los reportes de ventas se actualizan para reflejar el neto correcto',
        ]}
      />

      <Warning>
        <strong>Devoluciones de ventas a crédito:</strong> Si la venta fue fiada y aún
        no fue pagada, la devolución reduce o cancela la deuda del cliente. Si ya fue
        pagada, el reembolso puede hacerse en efectivo o como crédito.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ver el Historial de Devoluciones
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes revisar todas las devoluciones en <strong>Ventas → Devoluciones</strong> o
        en el historial del cliente específico. Cada devolución muestra:
      </p>

      <List
        items={[
          'Número de referencia de la devolución',
          'Venta original asociada',
          'Productos y cantidades devueltas',
          'Monto reembolsado y método',
          'Quién procesó la devolución y cuándo',
        ]}
      />

      <InfoBox>
        <strong>Permiso de devoluciones:</strong> Por seguridad, puedes configurar que solo
        los administradores puedan procesar devoluciones. El personal de caja sin este permiso
        verá un mensaje pidiendo autorización de un superior.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo hacer una devolución días después de la venta?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí, no hay límite de tiempo para procesar una devolución en Cuadra. La política
        de devoluciones la defines tú como negocio.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿La devolución afecta los reportes de ventas?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Las devoluciones se descuentan de las ventas brutas para mostrar el neto real
        en los reportes. Esto da una imagen más precisa de tu flujo de ingresos.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Se puede devolver solo parte de una venta?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. En el paso de selección puedes elegir qué productos y en qué cantidad devolver
        sin afectar los demás ítems de la misma venta.
      </p>
    </>
  );
}

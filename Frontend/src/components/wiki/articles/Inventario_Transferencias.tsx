import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Inventario_TransferenciasArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Las transferencias de inventario permiten mover stock de una sucursal a otra
        sin perder el control del inventario. Cuadra registra cada transferencia, quién
        la solicitó y quién la confirmó, manteniendo el stock exacto en cada local.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Crear una Transferencia
      </h2>

      <Step number={1} title="Ve a Inventario → Transferencias">
        En el módulo de inventario, busca la sección <strong>"Transferencias"</strong> o{' '}
        <strong>"Mover Stock"</strong>.
      </Step>

      <Step number={2} title="Haz clic en 'Nueva Transferencia'">
        Busca el botón <strong>"+ Nueva Transferencia"</strong>.
      </Step>

      <Step number={3} title="Selecciona el origen y destino">
        Elige la sucursal desde donde sale el stock (origen) y la sucursal que lo recibirá
        (destino).
      </Step>

      <Step number={4} title="Agrega los productos a transferir">
        Para cada producto:
        <List
          items={[
            'Busca el producto por nombre o código',
            'Ingresa la cantidad a transferir',
            'Cuadra te mostrará el stock disponible en la sucursal origen',
          ]}
        />
      </Step>

      <Step number={5} title="Confirma la transferencia">
        Haz clic en <strong>"Crear Transferencia"</strong>. El stock se descuenta de
        la sucursal origen y se incrementa en la sucursal destino.
      </Step>

      <Tip>
        <strong>Transferencia con confirmación:</strong> Puedes configurar el flujo para
        que la sucursal destino deba confirmar la recepción. Esto es útil si hay tiempo
        de traslado entre locales y quieres saber exactamente cuándo llegó la mercadería.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Estados de una Transferencia
      </h2>

      <List
        items={[
          'Pendiente: creada pero no confirmada por el destino',
          'En tránsito: enviada, esperando confirmación de recepción',
          'Completada: confirmada por la sucursal destino',
          'Cancelada: anulada antes de ser confirmada',
        ]}
      />

      <Warning>
        <strong>Stock en tránsito:</strong> Mientras la transferencia está pendiente o
        en tránsito, el stock ya se descuenta de la sucursal origen pero aún no está
        disponible en la destino. Considera esto al planificar ventas.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Confirmar una Transferencia Recibida
      </h2>

      <Step number={1} title="Ve a Transferencias pendientes">
        En la sucursal destino, ve a <strong>Inventario → Transferencias → Pendientes</strong>.
      </Step>

      <Step number={2} title="Revisa y confirma">
        Verifica que los productos y cantidades sean correctos y haz clic en{' '}
        <strong>"Confirmar Recepción"</strong>. Si hubo diferencia en las cantidades recibidas,
        puedes ajustar antes de confirmar.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Historial de Transferencias
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En <strong>Inventario → Transferencias → Historial</strong> puedes ver todas las
        transferencias realizadas con:
      </p>

      <List
        items={[
          'Fecha y hora de creación y confirmación',
          'Sucursal origen y destino',
          'Productos y cantidades transferidas',
          'Usuario que creó la transferencia',
        ]}
      />

      <InfoBox>
        <strong>Auditoría de stock:</strong> Cada transferencia genera un registro en el
        historial de movimientos del inventario de ambas sucursales, identificado como
        "Transferencia Entrada" o "Transferencia Salida" con referencia al número de
        transferencia.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo transferir entre sucursales sin tener múltiples locales?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Las transferencias requieren al menos dos sucursales activas. Si solo tienes una
        sucursal, usa los ajustes de inventario en su lugar.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo cancelar una transferencia después de crearla?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí, mientras esté en estado "Pendiente" o "En tránsito". Una vez confirmada la
        recepción, deberías crear una transferencia inversa para revertir el movimiento.
      </p>
    </>
  );
}

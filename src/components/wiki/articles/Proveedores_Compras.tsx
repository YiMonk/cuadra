import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Proveedores_ComprasArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Registrar las compras a proveedores en Cuadra actualiza automáticamente el stock
        de los productos, actualiza los costos y mantiene el historial de lo que has comprado
        a cada proveedor. Es la forma correcta de ingresar mercadería al sistema.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Registrar una Compra
      </h2>

      <Step number={1} title="Ve a Proveedores → Compras">
        En el menú de Proveedores, selecciona <strong>"Nueva Compra"</strong> o ve a la
        sección <strong>"Compras"</strong> y haz clic en <strong>"+ Nueva Compra"</strong>.
      </Step>

      <Step number={2} title="Selecciona el proveedor">
        Busca y selecciona el proveedor del que compraste la mercadería.
      </Step>

      <Step number={3} title="Agrega los productos comprados">
        Para cada producto de la compra:
        <List
          items={[
            'Busca el producto por nombre o código',
            'Ingresa la cantidad comprada',
            'Confirma o actualiza el costo unitario (precio que pagaste)',
          ]}
        />
      </Step>

      <Step number={4} title="Define la fecha y forma de pago">
        Ingresa la fecha de la compra (puede ser hoy u otra fecha) y el método de pago:
        contado, transferencia, crédito al proveedor, etc.
      </Step>

      <Step number={5} title="Confirma la compra">
        Haz clic en <strong>"Registrar Compra"</strong>. El stock de cada producto se
        incrementa automáticamente con las cantidades compradas.
      </Step>

      <Tip>
        <strong>Actualiza el costo:</strong> Si el proveedor te cambió el precio, actualiza
        el costo en el momento de registrar la compra. Esto mejora la precisión del margen
        en los reportes de ganancias.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Qué Ocurre al Registrar una Compra
      </h2>

      <List
        items={[
          'El stock de cada producto aumenta según las cantidades ingresadas',
          'Si actualizaste el costo, el nuevo costo queda en el producto',
          'La compra queda en el historial del proveedor',
          'Si fue a crédito, la deuda queda registrada en la cuenta del proveedor',
        ]}
      />

      <Warning>
        <strong>Compra recibida parcialmente:</strong> Si el proveedor te entregó solo
        parte del pedido, registra solo lo que efectivamente recibiste. El stock solo
        debe subir por lo que físicamente tienes en tu local.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Historial de Compras
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes ver el historial de compras de dos formas:
      </p>

      <List
        items={[
          'Por proveedor: abre el perfil del proveedor y ve a "Historial de Compras"',
          'General: ve a Proveedores → Compras para ver todas las compras del período',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Cada compra muestra fecha, productos, cantidades, costos totales y estado de pago.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Orden de Compra (Pedido)
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Antes de recibir la mercadería, puedes crear una orden de compra (pedido) que
        luego conviertes en compra al recibirla. Esto te permite:
      </p>

      <List
        items={[
          'Planificar qué vas a pedir antes de llamar al proveedor',
          'Comparar lo pedido vs lo que llegó',
          'Tener un registro de cuándo pediste para hacer seguimiento',
        ]}
      />

      <InfoBox>
        <strong>Múltiples productos en una compra:</strong> Una sola compra puede incluir
        decenas de productos. No necesitas registrar una compra por producto. Agrega todos
        los ítems del pedido en una sola operación.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo registrar una compra de un proveedor que no existe en el sistema?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes crear el proveedor directamente desde el formulario de nueva compra sin
        tener que salir y crearlo primero.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo editar una compra ya registrada?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Las compras confirmadas son difíciles de editar para mantener integridad del stock.
        Si hubo un error, registra un ajuste de inventario con el motivo correspondiente.
      </p>
    </>
  );
}

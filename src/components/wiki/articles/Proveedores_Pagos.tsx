import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Proveedores_PagosArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El módulo de pagos a proveedores te permite registrar cuándo y cuánto le pagas
        a cada proveedor, llevar el control de las deudas pendientes y ver el historial
        completo de pagos para evitar pagos duplicados o deudas olvidadas.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Registrar un Pago a Proveedor
      </h2>

      <Step number={1} title="Abre el perfil del proveedor">
        Ve a <strong>Proveedores</strong>, busca el proveedor y ábrelo.
      </Step>

      <Step number={2} title="Ve a la sección de deudas o pagos">
        Busca la pestaña <strong>"Cuenta Corriente"</strong> o <strong>"Deudas"</strong>
        donde verás el saldo pendiente.
      </Step>

      <Step number={3} title="Haz clic en 'Registrar Pago'">
        Encontrarás el botón junto a la deuda pendiente o un botón general para abonar.
      </Step>

      <Step number={4} title="Ingresa el monto y método de pago">
        Escribe cuánto pagaste (puede ser pago total o abono parcial) y selecciona el
        método: transferencia, efectivo, cheque, etc.
      </Step>

      <Step number={5} title="Confirma el pago">
        Haz clic en <strong>"Registrar Pago"</strong>. La deuda se reduce y el pago
        queda en el historial del proveedor.
      </Step>

      <Tip>
        <strong>Número de comprobante:</strong> Al registrar un pago, agrega el número
        de transferencia o comprobante en el campo de notas. Esto facilita conciliar
        pagos con tu banco o contador.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ver Deudas con Proveedores
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Para ver el estado general de lo que debes a cada proveedor, ve a{' '}
        <strong>Proveedores → Cuentas por Pagar</strong>. Verás:
      </p>

      <List
        items={[
          'Lista de proveedores con saldo pendiente',
          'Monto total adeudado a cada uno',
          'Compras individuales que componen la deuda',
          'Fecha de vencimiento si configuraste plazos de pago',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Condiciones de Pago por Proveedor
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes configurar las condiciones de pago habituales de cada proveedor en su perfil:
      </p>

      <List
        items={[
          'Contado: pago al momento de la compra',
          '7 días: pago a los 7 días de la compra',
          '30 días: pago a los 30 días',
          'Personalizado: número de días específico',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Con condiciones configuradas, Cuadra puede mostrarte qué facturas están próximas
        a vencer para que no se te pasen los plazos.
      </p>

      <InfoBox>
        <strong>Flujo de caja:</strong> Tener registradas las deudas con proveedores te
        ayuda a planificar el flujo de caja: saber cuánto dinero necesitas tener disponible
        en los próximos días para pagar a tiempo y mantener buenas relaciones comerciales.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Historial de Pagos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En el perfil de cada proveedor puedes ver el historial completo de pagos realizados:
        fecha, monto, método y cualquier nota o número de comprobante registrado.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo registrar pagos anticipados (sin una compra previa)?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Puedes registrar un pago sin asociarlo a una compra específica. Quedará como
        saldo a favor que se descontará de las próximas compras.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Los pagos a proveedores aparecen en los gastos?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Depende. Los pagos por mercadería de inventario aparecen en el costo de ventas,
        no en gastos operacionales. Si quieres que aparezcan también en el módulo de
        gastos, debes registrarlos manualmente allí con la categoría correspondiente.
      </p>
    </>
  );
}

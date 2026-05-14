import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Clientes_HistorialArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El historial de un cliente muestra todas sus compras, pagos y movimientos de cuenta.
        Es una herramienta poderosa para entender el comportamiento de cada cliente y
        tomar decisiones sobre crédito, promociones y atención personalizada.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ver el Historial de un Cliente
      </h2>

      <Step number={1} title="Abre el perfil del cliente">
        Ve a <strong>Clientes</strong>, busca el cliente por nombre o teléfono y haz clic
        en su nombre.
      </Step>

      <Step number={2} title="Accede a la pestaña de historial">
        En el perfil del cliente, busca la pestaña <strong>"Historial"</strong> o{' '}
        <strong>"Compras"</strong>.
      </Step>

      <Step number={3} title="Filtra si es necesario">
        Puedes filtrar por rango de fechas para ver solo las compras de un período específico.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Qué Información Muestra el Historial
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Por cada venta o movimiento verás:
      </p>

      <List
        items={[
          'Fecha y hora de la compra',
          'Productos comprados y cantidades',
          'Monto total de la venta',
          'Método de pago utilizado (efectivo, transferencia, crédito, etc.)',
          'Si fue a crédito: estado del pago (pendiente, pagado parcialmente, cancelado)',
          'Quién registró la venta (cajero)',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Análisis del Comportamiento del Cliente
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El perfil del cliente también muestra estadísticas útiles:
      </p>

      <List
        items={[
          'Total gastado (lifetime value del cliente)',
          'Número total de compras realizadas',
          'Ticket promedio por compra',
          'Última fecha de visita',
          'Productos más comprados',
        ]}
      />

      <Tip>
        <strong>Usa el historial para fidelizar:</strong> Si un cliente que compra cada semana
        lleva más de 20 días sin aparecer, puedes contactarlo. Cuadra te da los datos,
        tú le das la atención personalizada.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ver Detalles de una Venta Específica
      </h2>

      <Step number={1} title="Encuentra la venta en el historial">
        Navega por el historial del cliente hasta encontrar la venta que quieres revisar.
      </Step>

      <Step number={2} title="Haz clic en la venta">
        Haz clic en la venta para ver el detalle completo: cada producto, precio unitario,
        descuentos aplicados y total.
      </Step>

      <Step number={3} title="Opciones disponibles">
        Desde el detalle de la venta puedes: imprimir o reenviar el comprobante, registrar
        un pago si fue a crédito, o procesar una devolución si aplica.
      </Step>

      <InfoBox>
        <strong>Exportar historial:</strong> Puedes exportar el historial completo de un
        cliente a CSV para análisis externos o para compartirlo con el cliente si lo solicita.
        Busca el botón "Exportar" en la vista de historial.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Reporte Global de Clientes
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Además del historial individual, en <strong>Reportes → Clientes</strong> puedes ver:
      </p>

      <List
        items={[
          'Ranking de clientes por monto gastado',
          'Clientes nuevos vs recurrentes por período',
          'Clientes con deudas pendientes ordenados por monto',
          'Frecuencia de visita por cliente',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Se puede borrar una venta del historial de un cliente?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No directamente. El historial es inmutable para garantizar integridad. Si hubo
        un error en una venta, debes procesarla como devolución, lo que quedará también
        registrado en el historial.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El historial es visible para el personal de caja?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Depende del rol configurado. Los administradores siempre ven el historial completo.
        Para el personal de caja, el administrador puede configurar si pueden o no ver el
        historial de clientes en la sección de permisos.
      </p>
    </>
  );
}

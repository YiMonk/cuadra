import React from 'react';
import { Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Reportes_ClientesArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El reporte de clientes te ayuda a entender quiénes son tus mejores compradores,
        cuánto han gastado, con qué frecuencia visitan tu negocio y cuánto te deben.
        Con esta información puedes fidelizar a los mejores y recuperar a los que dejaron
        de venir.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Acceder al Reporte de Clientes
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ve a <strong>Reportes → Clientes</strong>. Encontrarás varias sub-vistas con
        diferentes análisis del comportamiento de tus clientes.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ranking de Mejores Clientes
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Lista de clientes ordenados por monto total gastado en el período. Para cada uno verás:
      </p>

      <List
        items={[
          'Nombre del cliente',
          'Total gastado en el período',
          'Número de compras realizadas',
          'Ticket promedio',
          'Última fecha de visita',
        ]}
      />

      <Tip>
        <strong>Programa de fidelización:</strong> Con este ranking puedes identificar tus
        clientes VIP y ofrecerles descuentos especiales, precios de mayorista o simplemente
        reconocimiento. Retener a un cliente existente cuesta 5 veces menos que conseguir
        uno nuevo.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Clientes con Deudas Pendientes
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Vista específica de cuentas por cobrar, ordenada de mayor a menor deuda. Muestra:
      </p>

      <List
        items={[
          'Cliente y monto total adeudado',
          'Número de compras a crédito pendientes',
          'Fecha de la deuda más antigua',
          'Última fecha de pago o abono',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Usa este reporte para priorizar los cobros y hacer seguimiento a clientes
        con deudas antiguas.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Clientes Nuevos vs Recurrentes
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Este análisis muestra cuántos clientes compraron por primera vez vs cuántos ya
        habían comprado antes. Una proporción saludable depende del tipo de negocio, pero
        en general:
      </p>

      <List
        items={[
          'Alta recurrencia = clientes fieles, buen producto y servicio',
          'Alta proporción de nuevos = buen marketing de captación',
          'Caída en recurrencia = señal de alerta, los clientes no vuelven',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Clientes Inactivos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Identifica clientes que compraban con frecuencia pero llevan más de X días sin
        comprar. Puedes configurar el umbral (ej: clientes que no compran hace más de 30 días).
        Útil para:
      </p>

      <List
        items={[
          'Llamarlos o enviarles un mensaje recordándoles tu negocio',
          'Ofrecerles una promoción de "regreso" para reactivarlos',
          'Entender si hay un patrón en la pérdida de clientes',
        ]}
      />

      <InfoBox>
        <strong>Exportar para marketing:</strong> Desde este reporte puedes exportar la
        lista de clientes (con nombre, teléfono, email) para campañas de WhatsApp o correo.
        Filtra por clientes activos, inactivos o por monto gastado para segmentar mejor
        tus comunicaciones.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Aparecen las ventas sin cliente asignado?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No en el reporte de clientes. Las ventas sin cliente asignado aparecen en el reporte
        de ventas general. Por eso es importante asignar cliente cuando vendes a crédito.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El reporte incluye los pagos de deudas?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Los pagos de deudas no se cuentan como nueva venta. Aparecen en el historial
        del cliente como "Pago de cuenta", separados de las compras.
      </p>
    </>
  );
}

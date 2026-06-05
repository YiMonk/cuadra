import React from 'react';
import { Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Reportes_VentasArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El reporte de ventas es la fuente central de información sobre los ingresos de tu
        negocio. Muestra cuánto vendiste, qué vendiste más, en qué horarios, qué métodos
        de pago usan tus clientes y cómo evolucionan tus ventas en el tiempo.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Acceder al Reporte de Ventas
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ve a <strong>Reportes → Ventas</strong>. Encontrarás filtros para ajustar el período
        y las vistas disponibles.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Métricas Principales
      </h2>

      <List
        items={[
          'Ventas totales: suma de todas las ventas del período (bruto)',
          'Ventas netas: ventas menos devoluciones',
          'Número de transacciones: cuántas ventas se realizaron',
          'Ticket promedio: ventas netas ÷ número de transacciones',
          'Productos vendidos: cantidad total de unidades vendidas',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Filtros Disponibles
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes filtrar el reporte de ventas por:
      </p>

      <List
        items={[
          'Rango de fechas (hoy, esta semana, este mes, rango personalizado)',
          'Sucursal (si tienes múltiples locales)',
          'Cajero o vendedor',
          'Método de pago (efectivo, tarjeta, transferencia)',
          'Categoría de producto',
        ]}
      />

      <Tip>
        <strong>Vista diaria vs mensual:</strong> Usa la vista diaria para detectar días de
        alta y baja demanda. Usa la vista mensual para tendencias de largo plazo. Combinar
        ambas te da la imagen completa.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Productos Más Vendidos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Dentro del reporte de ventas encontrarás el ranking de productos más vendidos,
        que muestra:
      </p>

      <List
        items={[
          'Nombre del producto',
          'Unidades vendidas en el período',
          'Ingresos generados por ese producto',
          'Participación porcentual en las ventas totales',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Este ranking es clave para decisiones de reposición, negociación con proveedores
        y para saber qué productos destacar en tu local.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ventas por Hora y Día
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El mapa de calor de ventas muestra en qué horas y días de la semana se concentra
        tu tráfico. Útil para:
      </p>

      <List
        items={[
          'Planificar turnos de personal según demanda real',
          'Programar reposición de stock antes de las horas pico',
          'Planificar promociones en horas de baja demanda para atraer clientes',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ventas por Método de Pago
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ver qué porcentaje de tus ventas se paga en efectivo vs transferencia vs tarjeta
        te ayuda a:
      </p>

      <List
        items={[
          'Planificar cuánto efectivo debes tener disponible en la caja',
          'Evaluar si vale la pena contratar un terminal de pago',
          'Entender las preferencias de pago de tus clientes',
        ]}
      />

      <InfoBox>
        <strong>Exportar el reporte:</strong> Desde la vista de ventas puedes exportar a CSV
        para análisis externos en Excel o Google Sheets. El export incluye cada venta con
        fecha, productos, monto y método de pago.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Las devoluciones se descuentan del reporte?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Las ventas netas ya descuentan las devoluciones. También puedes ver las ventas
        brutas y el total de devoluciones como líneas separadas.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo comparar ventas de dos períodos?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. El reporte incluye comparación automática con el período anterior equivalente
        (semana anterior, mes anterior, mismo mes del año pasado) mostrando la variación
        en porcentaje.
      </p>
    </>
  );
}

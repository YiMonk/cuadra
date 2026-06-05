import React from 'react';
import { Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Gastos_AnalisisArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El análisis de gastos te ayuda a entender en qué estás gastando, cuánto representa
        cada categoría sobre tus ingresos y si tus costos están creciendo o bajando mes a mes.
        Es la diferencia entre saber que vendiste bien y saber si realmente ganaste dinero.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Acceder al Análisis de Gastos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ve a <strong>Reportes → Gastos</strong> o directamente desde el módulo{' '}
        <strong>Gastos → Análisis</strong>. Verás vistas con:
      </p>

      <List
        items={[
          'Total gastado en el período seleccionado',
          'Desglose por categoría (gráfico de torta o barras)',
          'Comparación con el período anterior',
          'Tendencia mes a mes de cada categoría',
          'Gastos como porcentaje de las ventas totales',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Indicadores Clave a Monitorear
      </h2>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Ratio Gastos / Ventas
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuánto de cada peso vendido se va en gastos operacionales. Si vendes $1.000.000 y
        tus gastos son $300.000, tu ratio es 30%. Un ratio saludable depende del tipo de
        negocio, pero en general menor es mejor.
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Crecimiento de Gastos vs Crecimiento de Ventas
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Si tus ventas crecen 20% pero tus gastos crecen 35%, tu rentabilidad está bajando
        aunque vendas más. El análisis comparativo te ayuda a detectar esto.
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Categorías que más crecen
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Identifica si alguna categoría está creciendo de forma descontrolada. Muchas veces
        los pequeños gastos de "varios" acumulados mes a mes representan un monto significativo.
      </p>

      <Tip>
        <strong>Compara meses similares:</strong> Un mes de diciembre siempre tendrá más
        ventas y posiblemente más gastos. Compara diciembre con el diciembre del año anterior,
        no con noviembre, para tener una comparación justa.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Utilidad Neta vs Margen Bruto
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El análisis de gastos conecta con el reporte de ganancias para mostrarte dos métricas:
      </p>

      <List
        items={[
          'Margen bruto: ingresos por ventas menos el costo de los productos vendidos',
          'Utilidad neta: margen bruto menos todos los gastos operacionales registrados',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Si solo miras el margen bruto, puedes creer que tu negocio va bien cuando en realidad
        los gastos operacionales están consumiendo toda la ganancia.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Exportar el Análisis
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Desde la vista de análisis puedes exportar a CSV para llevar los datos a una hoja
        de cálculo o compartirlos con tu contador. El export incluye:
      </p>

      <List
        items={[
          'Cada gasto individual con fecha, categoría y monto',
          'Subtotales por categoría',
          'Total del período',
        ]}
      />

      <InfoBox>
        <strong>Frecuencia recomendada:</strong> Revisa el análisis de gastos mensualmente,
        idealmente los primeros días del mes siguiente, cuando ya tienes todos los gastos
        del mes anterior registrados. Esto te permite detectar desvíos antes de que se
        conviertan en un problema.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Los gastos de compra a proveedores aparecen aquí?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Depende. Las compras de mercadería para inventario se reflejan en el costo de productos
        vendidos (reportes de inventario). El módulo de gastos captura los costos operacionales
        que no son mercadería directa.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo filtrar por categoría?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. En el análisis de gastos puedes filtrar por una o varias categorías para ver
        el detalle de un tipo específico de gasto en el período que elijas.
      </p>
    </>
  );
}

import React from 'react';
import { Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Reportes_InventarioArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Los reportes de inventario te dan visibilidad sobre el estado actual de tu stock,
        el valor económico del inventario, qué productos rotan más y cuáles tienes parados.
        Son esenciales para optimizar tu capital de trabajo y evitar quedarte sin stock
        de los productos que más se venden.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Inventario Actual
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        La vista de inventario actual en <strong>Reportes → Inventario</strong> muestra
        el estado del stock en tiempo real:
      </p>

      <List
        items={[
          'Stock disponible por producto',
          'Indicador visual de nivel (verde/amarillo/rojo según el mínimo configurado)',
          'Valor del inventario: stock × costo de cada producto',
          'Productos con stock cero o negativo',
          'Productos que están cerca del stock mínimo',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Inventario Valorizado
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Muestra cuánto capital tienes inmovilizado en inventario. Útil para:
      </p>

      <List
        items={[
          'Entender el valor total de tu stock actual',
          'Identificar productos con mucho stock parado (capital inmovilizado)',
          'Calcular el seguro de mercadería',
          'Reportes contables',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        El valor se calcula como: <strong>cantidad en stock × costo unitario</strong> para
        cada producto. Por eso es importante tener los costos actualizados.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Análisis ABC de Productos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El análisis ABC clasifica tus productos según su importancia en ventas:
      </p>

      <List
        items={[
          'Categoría A: 20% de productos que generan el 80% de las ventas — nunca deben faltarte',
          'Categoría B: productos de ventas medias — mantener stock moderado',
          'Categoría C: productos de baja rotación — stock mínimo para no exceder capital',
        ]}
      />

      <Tip>
        <strong>Usa el ABC para comprar inteligente:</strong> No todos los productos merecen
        el mismo nivel de atención. Focaliza tu energía en nunca quedarte sin los productos A,
        que son los que sostienen tu negocio.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Rotación de Inventario
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        La rotación indica cuántas veces se "renueva" tu inventario en un período. Una
        rotación alta significa que vendes rápido y necesitas reponer seguido. Una rotación
        baja puede indicar sobre-stock o productos que no se venden.
      </p>

      <List
        items={[
          'Rotación alta (ej: >12 veces al año): muy buena señal, el producto vende bien',
          'Rotación media (4-12 veces): normal, depende del tipo de producto',
          'Rotación baja (<4 veces): producto lento, considera reducir stock o hacer promoción',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Sugerencias de Reorden
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra calcula automáticamente qué productos deberías reponer basándose en:
      </p>

      <List
        items={[
          'Stock actual vs stock mínimo configurado',
          'Velocidad de venta histórica del producto',
          'Días de reposición estimados (configurable por producto)',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Encuentra estas sugerencias en <strong>Inventario → Sugerencias de Reorden</strong> o
        en la sección de alertas del reporte de inventario.
      </p>

      <InfoBox>
        <strong>Exportar inventario:</strong> Puedes exportar el inventario completo a CSV
        desde <strong>Inventario → Exportar</strong> para llevar el control en una hoja
        de cálculo, compartirlo con proveedores o usarlo como respaldo.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El inventario se actualiza en tiempo real?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Cada venta, compra, ajuste o transferencia actualiza el stock inmediatamente.
        Lo que ves en los reportes es el estado actual del inventario.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo ver el historial de movimientos de un producto específico?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. Abre el producto en Inventario y ve a la pestaña "Historial" o "Movimientos"
        para ver todas las entradas y salidas con fecha, tipo de movimiento y usuario
        que lo realizó.
      </p>
    </>
  );
}

import React from 'react';
import { Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Reportes_GananciasArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El reporte de ganancias muestra la rentabilidad real de tu negocio: no solo cuánto
        vendiste, sino cuánto ganaste después de descontar el costo de los productos y los
        gastos operacionales. Es el número más importante para la salud de tu negocio.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Conceptos Clave
      </h2>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Ingresos por Ventas
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El total cobrado a los clientes por los productos vendidos en el período.
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Costo de Ventas (CMV)
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Lo que pagaste a los proveedores por los productos que vendiste. Cuadra lo calcula
        automáticamente usando el costo registrado en cada producto multiplicado por las
        unidades vendidas.
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Margen Bruto
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ingresos menos costo de ventas. Es la ganancia antes de pagar arriendo, sueldos, etc.
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Gastos Operacionales
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Todos los gastos registrados en el módulo de Gastos: arriendo, servicios, sueldos, etc.
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Utilidad Neta
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Margen bruto menos gastos operacionales. Es el dinero que realmente ganaste.
      </p>

      <Warning>
        <strong>Sin costos de producto = margen incorrecto:</strong> Si los productos no
        tienen costo registrado, el reporte mostrará un margen bruto del 100%, que es
        incorrecto. Asegúrate de registrar el costo de cada producto en el inventario.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Acceder al Reporte de Ganancias
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ve a <strong>Reportes → Ganancias</strong>. Selecciona el período (mes, trimestre,
        año) y verás el estado de resultados simplificado.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Análisis por Producto
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El reporte de ganancias permite ver el margen por producto individual:
      </p>

      <List
        items={[
          'Productos con mayor margen en porcentaje (los más rentables)',
          'Productos con mayor aporte en monto absoluto (los más importantes para las ganancias)',
          'Productos con margen negativo o muy bajo (que deberías revisar el precio)',
        ]}
      />

      <Tip>
        <strong>Margen vs volumen:</strong> Un producto con 60% de margen que vendes poco
        puede aportar menos que uno con 20% de margen que vendes cientos de unidades al día.
        Analiza tanto el margen porcentual como el monto total de ganancia por producto.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Margen por Categoría
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes ver la rentabilidad por categoría de producto para entender cuál es la
        más lucrativa de tu negocio. Esto ayuda a:
      </p>

      <List
        items={[
          'Decidir en qué categorías ampliar el surtido',
          'Identificar categorías que no son rentables y considerar eliminarlas',
          'Negociar mejores precios con proveedores de categorías clave',
        ]}
      />

      <InfoBox>
        <strong>Proyección del mes:</strong> En el reporte de ganancias encontrarás la
        proyección del mes completo basada en el promedio de los días ya transcurridos.
        Útil para anticipar si el mes va a ser bueno o si necesitas tomar acciones.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Por qué mi margen bruto es 100% en algunos productos?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Porque esos productos no tienen costo registrado. Ve a Inventario, edita el producto
        y agrega el costo de compra. El reporte se actualizará con el margen correcto.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El IVA está incluido?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Depende de cómo hayas configurado los precios. Si los precios incluyen IVA, el
        reporte trabaja con esos precios. Consulta la configuración de impuestos en
        <strong> Configuración → General</strong> para ajustar según tu régimen fiscal.
      </p>
    </>
  );
}

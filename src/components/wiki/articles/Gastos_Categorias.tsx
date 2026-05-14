import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Gastos_CategoriasArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Las categorías de gastos organizan tus egresos por tipo (arriendo, personal, servicios)
        para que puedas ver en qué áreas estás gastando más y tomar decisiones más inteligentes
        sobre tus costos operacionales.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Categorías Predefinidas
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra viene con categorías de gastos comunes que puedes usar desde el primer día:
      </p>

      <List
        items={[
          'Arriendo — pago mensual del local o bodega',
          'Servicios básicos — luz, agua, gas, internet, teléfono',
          'Personal — sueldos, honorarios, bonos',
          'Marketing — publicidad, redes sociales, impresos',
          'Mantenimiento — reparaciones, limpieza del local',
          'Insumos — materiales de embalaje, oficina, etc.',
          'Bancarios — comisiones, cuotas de mantención de cuenta',
          'Otros — gastos que no encajan en las demás categorías',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Crear una Categoría Personalizada
      </h2>

      <Step number={1} title="Ve a Gastos → Categorías">
        En el menú de Gastos, busca la sección <strong>"Categorías"</strong> o accede
        desde <strong>Configuración → Gastos</strong>.
      </Step>

      <Step number={2} title="Haz clic en 'Nueva Categoría'">
        Busca el botón <strong>"+ Nueva Categoría"</strong> o <strong>"Agregar"</strong>.
      </Step>

      <Step number={3} title="Define el nombre">
        Escribe un nombre claro y descriptivo: por ejemplo, "Comisiones de venta",
        "Impuestos municipales" o "Transporte y logística".
      </Step>

      <Step number={4} title="Guarda">
        Haz clic en <strong>"Guardar"</strong>. La nueva categoría aparecerá disponible
        al registrar gastos.
      </Step>

      <Tip>
        <strong>Menos es más:</strong> No crees una categoría para cada tipo de gasto pequeño.
        Mantén entre 6 y 12 categorías para que los reportes sean legibles y accionables.
        Demasiadas categorías dificultan el análisis.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Usar Categorías en los Reportes
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Las categorías cobran su mayor valor en el reporte de análisis de gastos, donde puedes:
      </p>

      <List
        items={[
          'Ver el total gastado por categoría en un período',
          'Comparar gastos por categoría entre meses',
          'Identificar qué categoría representa el mayor porcentaje de tus costos',
          'Ver la evolución de una categoría a lo largo del tiempo',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Para acceder a estos análisis ve a <strong>Reportes → Gastos</strong> y selecciona
        la vista por categorías.
      </p>

      <InfoBox>
        <strong>Consistencia en categorización:</strong> Si un mes clasificas el internet
        en "Servicios básicos" y el siguiente en "Otros", los reportes serán difíciles
        de comparar. Establece una categoría fija para cada tipo de gasto desde el inicio.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo eliminar una categoría que ya tiene gastos asignados?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No directamente. Primero debes reasignar los gastos a otra categoría o dejar la
        categoría desactivada para que no aparezca al registrar nuevos gastos.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Las categorías de gastos son las mismas que las de inventario?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        No. Son sistemas separados. Las categorías de inventario agrupan productos;
        las categorías de gastos agrupan costos operacionales. Cada una se gestiona
        de forma independiente.
      </p>
    </>
  );
}

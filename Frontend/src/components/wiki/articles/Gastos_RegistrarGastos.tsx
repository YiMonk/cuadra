import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Gastos_RegistrarGastosArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El módulo de gastos te permite registrar todos los costos operacionales de tu negocio
        (arriendo, servicios, sueldos, insumos) para que al revisar los reportes de ganancias
        veas la utilidad real, no solo el margen bruto de ventas.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Registrar un Gasto
      </h2>

      <Step number={1} title="Ve al módulo de Gastos">
        En el menú lateral, haz clic en <strong>Gastos</strong>. Verás la lista de gastos
        registrados y el botón para agregar nuevos.
      </Step>

      <Step number={2} title="Haz clic en 'Nuevo Gasto'">
        Busca el botón <strong>"+ Nuevo Gasto"</strong> o <strong>"Registrar Gasto"</strong>.
      </Step>

      <Step number={3} title="Completa los datos del gasto">
        Llena la información:
        <List
          items={[
            'Descripción: qué fue el gasto (ej: "Cuenta de luz Agosto")',
            'Monto: cuánto costó',
            'Categoría: clasifica el gasto (arriendo, servicios, sueldos, etc.)',
            'Fecha: cuándo ocurrió el gasto',
          ]}
        />
      </Step>

      <Step number={4} title="Agrega información adicional (opcional)">
        <List
          items={[
            'Proveedor: si el gasto corresponde a un proveedor registrado',
            'Método de pago: efectivo, transferencia, etc.',
            'Notas adicionales o número de factura',
          ]}
        />
      </Step>

      <Step number={5} title="Guarda el gasto">
        Haz clic en <strong>"Guardar"</strong>. El gasto aparecerá en la lista y se incluirá
        en los reportes de rentabilidad.
      </Step>

      <Tip>
        <strong>Gastos recurrentes:</strong> Para gastos que se repiten mensualmente (arriendo,
        servicios básicos), puedes configurarlos como recurrentes para que Cuadra te recuerde
        registrarlos cada mes.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ejemplos de Gastos Comunes
      </h2>

      <List
        items={[
          'Arriendo del local o bodega',
          'Servicios básicos (luz, agua, internet)',
          'Sueldos y honorarios del personal',
          'Insumos de limpieza y materiales de oficina',
          'Publicidad y marketing (volantes, redes sociales)',
          'Mantenimiento y reparaciones',
          'Seguros del negocio',
          'Comisiones bancarias y de terminales de pago',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Editar o Eliminar un Gasto
      </h2>

      <Step number={1} title="Encuentra el gasto">
        En la lista de gastos, usa los filtros de fecha o categoría para encontrarlo.
      </Step>

      <Step number={2} title="Abre el gasto">
        Haz clic en el gasto para ver sus detalles.
      </Step>

      <Step number={3} title="Edita o elimina">
        Usa el botón <strong>"Editar"</strong> para modificar datos, o <strong>"Eliminar"</strong>
        si fue registrado por error.
      </Step>

      <Warning>
        <strong>Consistencia contable:</strong> Si ya exportaste reportes del período donde
        aparece ese gasto, eliminar o modificarlo cambiará los números históricos. Considera
        registrar un ajuste en lugar de editar el gasto original.
      </Warning>

      <InfoBox>
        <strong>Impacto en reportes:</strong> Los gastos registrados se restan de las ventas
        en el <strong>Reporte de Ganancias</strong>, dándote la utilidad neta real del negocio.
        Sin gastos registrados, ese reporte solo muestra el margen bruto.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Los gastos afectan el inventario?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No. Los gastos son para costos operacionales. Para registrar compras de mercadería
        que van al inventario, usa el módulo de <strong>Proveedores → Compras</strong>.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo adjuntar comprobantes o facturas?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Puedes agregar notas y el número de factura en el campo de notas. Para adjuntar
        archivos digitales, consulta si tu versión de Cuadra incluye esa función.
      </p>
    </>
  );
}

import React from 'react';
import { Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Sucursales_AdministrarArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Administrar múltiples sucursales desde Cuadra significa tener visibilidad de cada
        local, poder comparar su desempeño, gestionar el inventario entre ellas y asegurarte
        de que cada equipo tenga solo el acceso que necesita.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Dashboard Comparativo
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En <strong>Reportes → Comparativo Sucursales</strong> puedes ver todas las sucursales
        en un solo lugar con métricas clave:
      </p>

      <List
        items={[
          'Ventas del período por sucursal',
          'Ticket promedio de cada local',
          'Stock total valorizado por sucursal',
          'Productos con stock bajo por sucursal',
          'Número de ventas y clientes atendidos',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Puedes filtrar por período (hoy, esta semana, este mes) y ver los gráficos comparativos
        para identificar qué sucursal está vendiendo más y cuál necesita atención.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Gestión de Inventario Multi-sucursal
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cada sucursal tiene su stock independiente. Desde el inventario puedes:
      </p>

      <List
        items={[
          'Ver el stock de cada sucursal de forma individual',
          'Filtrar el inventario por sucursal',
          'Identificar sucursales con stock bajo de algún producto',
          'Crear transferencias de stock entre sucursales',
        ]}
      />

      <Tip>
        <strong>Centraliza las compras:</strong> Si compras mercadería en grandes volúmenes
        para distribuir entre sucursales, regístrala en la sucursal central y luego
        usa transferencias para mover stock a cada local. Así mantienes el inventario
        de cada sucursal actualizado.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Control de Acceso por Sucursal
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Asegúrate de que cada miembro del equipo tenga acceso solo a las sucursales que
        le corresponden:
      </p>

      <List
        items={[
          'Cajero de sucursal A: solo ve ventas, inventario y caja de sucursal A',
          'Administrador regional: ve varias sucursales asignadas',
          'Propietario: ve todas las sucursales',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Configura estos accesos en <strong>Equipo → [usuario] → Sucursales asignadas</strong>.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Reportes Consolidados vs Por Sucursal
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Todos los reportes en Cuadra tienen un filtro de sucursal:
      </p>

      <List
        items={[
          '"Todas las sucursales": suma consolidada del total del negocio',
          '"Sucursal específica": datos solo de ese local',
          'Comparativo: columnas separadas para cada sucursal',
        ]}
      />

      <InfoBox>
        <strong>Precios por sucursal:</strong> Puedes tener listas de precios distintas
        por sucursal. Por ejemplo, la sucursal en un barrio de mayor poder adquisitivo
        puede manejar precios ligeramente más altos que otra sucursal. Configúralo en{' '}
        <strong>Precios & Promos → Listas de Precios</strong>.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo cerrar o desactivar una sucursal temporalmente?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Puedes desactivar una sucursal para que no aparezca en el selector y el equipo
        asignado no pueda operar en ella, manteniendo el historial intacto.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Los clientes son compartidos entre sucursales?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. La base de clientes es compartida entre todas las sucursales. Un cliente
        registrado en la sucursal norte puede comprar en la sucursal sur y su historial
        completo estará disponible en ambas.
      </p>
    </>
  );
}

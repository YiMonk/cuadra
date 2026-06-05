import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Sucursales_CrearSucursalArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Si tu negocio tiene más de un local, Cuadra te permite crear y gestionar múltiples
        sucursales desde una sola cuenta. Cada sucursal tiene su propio inventario, ventas
        y equipo, pero puedes verlas todas en un solo dashboard.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Crear una Nueva Sucursal
      </h2>

      <Step number={1} title="Ve a Configuración → Sucursales">
        En el menú de configuración, busca la sección <strong>"Sucursales"</strong> o{' '}
        <strong>"Locales"</strong>.
      </Step>

      <Step number={2} title="Haz clic en 'Nueva Sucursal'">
        Busca el botón <strong>"+ Nueva Sucursal"</strong> o <strong>"Agregar Local"</strong>.
      </Step>

      <Step number={3} title="Completa los datos de la sucursal">
        Ingresa:
        <List
          items={[
            'Nombre de la sucursal (ej: "Local Centro", "Sucursal Norte")',
            'Dirección completa',
            'Teléfono de la sucursal',
            'Horario de atención (opcional)',
          ]}
        />
      </Step>

      <Step number={4} title="Configura el inventario inicial">
        Decide si esta sucursal comparte inventario con la principal o tiene su propio stock
        independiente.
      </Step>

      <Step number={5} title="Guarda la sucursal">
        Haz clic en <strong>"Crear Sucursal"</strong>. La nueva sucursal aparecerá en el
        selector de sucursales en toda la app.
      </Step>

      <Tip>
        <strong>Stock independiente por sucursal:</strong> Cuadra maneja el stock por sucursal
        de forma separada. Una transferencia entre sucursales mueve físicamente unidades de
        una a otra, lo que se refleja en el inventario de cada una.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Configurar el Equipo por Sucursal
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Después de crear la sucursal, asigna los usuarios que trabajarán en ella:
      </p>

      <Step number={1} title="Ve a Equipo → [nombre del usuario]">
        Abre el perfil del usuario que quieres asignar.
      </Step>

      <Step number={2} title="Asigna la sucursal">
        En la configuración del usuario, selecciona la sucursal o sucursales a las que
        tiene acceso.
      </Step>

      <Step number={3} title="Guarda">
        El usuario solo verá datos de las sucursales asignadas al iniciar sesión.
      </Step>

      <Warning>
        <strong>Datos separados:</strong> Las ventas, reportes y sesiones de caja de cada
        sucursal son independientes. Un reporte de ventas puede verse por sucursal individual
        o consolidado (todas las sucursales).
      </Warning>

      <InfoBox>
        <strong>Dashboard multi-sucursal:</strong> Los propietarios y administradores
        pueden ver el dashboard comparativo de todas las sucursales en{' '}
        <strong>Reportes → Comparativo Sucursales</strong>, que muestra ventas, stock
        y métricas clave de cada local lado a lado.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo tener precios diferentes por sucursal?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Puedes crear listas de precios específicas y asignarlas a una sucursal,
        de modo que los mismos productos tengan precios distintos según el local.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El inventario de cada sucursal es independiente?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. Cada sucursal tiene su propio conteo de stock. Para mover mercadería entre
        sucursales debes usar el módulo de Transferencias en Inventario.
      </p>
    </>
  );
}

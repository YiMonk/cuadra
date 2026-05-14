import React from 'react';
import { Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Equipo_PermisosArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Los permisos definen qué puede ver y hacer cada usuario en Cuadra. Una buena
        configuración de permisos protege información sensible, evita errores accidentales
        y da a cada persona exactamente el acceso que necesita para su trabajo.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Roles y sus Permisos
      </h2>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Propietario (Owner)
      </h3>
      <List
        items={[
          'Acceso completo a todos los módulos',
          'Configuración del negocio (nombre, logo, datos fiscales)',
          'Gestión del plan y facturación',
          'Crear y eliminar otros propietarios o administradores',
          'Ver todos los reportes financieros',
        ]}
      />

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Administrador
      </h3>
      <List
        items={[
          'Acceso a todos los módulos operacionales',
          'Gestión de usuarios (excepto crear propietarios)',
          'Ver reportes financieros completos',
          'Procesar devoluciones y ajustes de inventario',
          'Configurar precios, promociones y cupones',
        ]}
      />

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Staff / Cajero
      </h3>
      <List
        items={[
          'Registrar ventas en el POS',
          'Abrir y cerrar sesiones de caja propias',
          'Ver y buscar productos en el inventario (sin editar)',
          'Buscar clientes y registrar pagos de deudas',
          'Ver su propio historial de ventas',
        ]}
      />

      <Tip>
        <strong>Principio de mínimo privilegio:</strong> Asigna a cada usuario solo los
        permisos que necesita para su rol. Un cajero no necesita ver los márgenes de
        ganancia; un vendedor no necesita editar el inventario.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Permisos Específicos Configurables
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Además de los roles, puedes ajustar permisos específicos para cada usuario:
      </p>

      <List
        items={[
          'Aplicar descuentos en el POS (sí/no, y límite máximo de porcentaje)',
          'Procesar devoluciones (sí/no)',
          'Ver precios de costo de los productos',
          'Acceder a reportes de ventas del período',
          'Registrar movimientos de caja manuales',
          'Editar información de clientes',
        ]}
      />

      <Warning>
        <strong>Cuidado con los descuentos:</strong> Si das permiso de descuento sin límite,
        un cajero podría vender productos a cero o con descuentos excesivos. Define siempre
        un porcentaje máximo o requiere autorización de un supervisor.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Permisos por Sucursal
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Si tienes múltiples sucursales, puedes restringir a qué sucursales tiene acceso
        cada usuario. Un cajero asignado solo a la sucursal A no podrá ver las ventas
        ni el inventario de la sucursal B.
      </p>

      <List
        items={[
          'Acceso a todas las sucursales (administradores)',
          'Acceso solo a una sucursal específica (cajeros)',
          'Acceso a un grupo de sucursales (supervisores regionales)',
        ]}
      />

      <InfoBox>
        <strong>Cambiar permisos:</strong> Puedes modificar el rol o permisos específicos
        de un usuario en cualquier momento desde <strong>Equipo → [nombre del usuario] → Editar</strong>.
        Los cambios aplican inmediatamente en la próxima acción del usuario.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Un cajero puede ver los reportes de ganancias?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Por defecto no. El acceso a reportes financieros está restringido a administradores
        y propietarios. Puedes habilitarlo individualmente si lo necesitas.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Qué pasa si un usuario intenta acceder a algo que no tiene permiso?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Cuadra simplemente no muestra la opción en el menú o muestra un mensaje de "acceso
        no permitido" si intenta navegar directamente a la URL. El usuario no puede realizar
        la acción ni ver la información restringida.
      </p>
    </>
  );
}

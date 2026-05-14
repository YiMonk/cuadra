import { lazy } from 'react';

export const articleComponents = {
  'primeros-pasos-intro': lazy(() => import('@/components/wiki/articles/PrimerosPA_Introduccion')),
  'primeros-pasos-login': lazy(() => import('@/components/wiki/articles/PrimerosPA_LoginConfiguracion')),
  'primeros-pasos-nav': lazy(() => import('@/components/wiki/articles/PrimerosPA_Navegacion')),

  'pos-crear-venta': lazy(() => import('@/components/wiki/articles/POS_CrearVenta')),
  'pos-metodos-pago': lazy(() => import('@/components/wiki/articles/POS_MetodosPago')),
  'pos-descuentos-cupones': lazy(() => import('@/components/wiki/articles/POS_DescuentosCupones')),
  'pos-devoluciones': lazy(() => import('@/components/wiki/articles/POS_Devoluciones')),

  'inventario-productos': lazy(() => import('@/components/wiki/articles/Inventario_Productos')),
  'inventario-stock': lazy(() => import('@/components/wiki/articles/Inventario_ControlStock')),
  'inventario-transferencias': lazy(() => import('@/components/wiki/articles/Inventario_Transferencias')),
  'inventario-importar': lazy(() => import('@/components/wiki/articles/Inventario_Importar')),

  'clientes-crear': lazy(() => import('@/components/wiki/articles/Clientes_CrearCliente')),
  'clientes-deudas': lazy(() => import('@/components/wiki/articles/Clientes_Deudas')),
  'clientes-historial': lazy(() => import('@/components/wiki/articles/Clientes_Historial')),

  'caja-sesiones': lazy(() => import('@/components/wiki/articles/Caja_Sesiones')),
  'caja-arqueo': lazy(() => import('@/components/wiki/articles/Caja_Arqueos')),
  'caja-movimientos': lazy(() => import('@/components/wiki/articles/Caja_Movimientos')),

  'reportes-ventas': lazy(() => import('@/components/wiki/articles/Reportes_Ventas')),
  'reportes-ganancias': lazy(() => import('@/components/wiki/articles/Reportes_Ganancias')),
  'reportes-clientes': lazy(() => import('@/components/wiki/articles/Reportes_Clientes')),
  'reportes-inventario': lazy(() => import('@/components/wiki/articles/Reportes_Inventario')),

  'gastos-crear': lazy(() => import('@/components/wiki/articles/Gastos_RegistrarGastos')),
  'gastos-categorias': lazy(() => import('@/components/wiki/articles/Gastos_Categorias')),
  'gastos-reporte': lazy(() => import('@/components/wiki/articles/Gastos_Analisis')),

  'proveedores-crear': lazy(() => import('@/components/wiki/articles/Proveedores_CrearProveedor')),
  'proveedores-compras': lazy(() => import('@/components/wiki/articles/Proveedores_Compras')),
  'proveedores-pagos': lazy(() => import('@/components/wiki/articles/Proveedores_Pagos')),

  'equipo-usuarios': lazy(() => import('@/components/wiki/articles/Equipo_Usuarios')),
  'equipo-permisos': lazy(() => import('@/components/wiki/articles/Equipo_Permisos')),
  'equipo-actividad': lazy(() => import('@/components/wiki/articles/Equipo_Actividad')),

  'sucursales-crear': lazy(() => import('@/components/wiki/articles/Sucursales_CrearSucursal')),
  'sucursales-admin': lazy(() => import('@/components/wiki/articles/Sucursales_Administrar')),

  'precios-promos-listas': lazy(() => import('@/components/wiki/articles/PreciosPromos_Listas')),
  'precios-promos-promociones': lazy(() => import('@/components/wiki/articles/PreciosPromos_Promociones')),

  'configuracion-general': lazy(() => import('@/components/wiki/articles/Configuracion_General')),
  'configuracion-temas': lazy(() => import('@/components/wiki/articles/Configuracion_Temas')),

  'faq-basicas': lazy(() => import('@/components/wiki/articles/FAQ_Basicas')),
  'faq-technical': lazy(() => import('@/components/wiki/articles/FAQ_Seguridad')),
  'faq-soporte': lazy(() => import('@/components/wiki/articles/FAQ_Soporte')),
};

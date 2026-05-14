# Create remaining article files with template content
$articles = @{
    "POS_DescuentosCupones" = "Aplicar Descuentos y Cupones";
    "POS_Devoluciones" = "Gestionar Devoluciones";
    "Inventario_Productos" = "Gestionar Productos";
    "Inventario_ControlStock" = "Control de Stock";
    "Inventario_Transferencias" = "Transferencias de Stock";
    "Inventario_Importar" = "Importar Productos";
    "Clientes_CrearCliente" = "Agregar Clientes";
    "Clientes_Deudas" = "Gestionar Deudas";
    "Clientes_Historial" = "Historial de Compras";
    "Caja_Sesiones" = "Sesiones de Caja";
    "Caja_Arqueos" = "Arqueos de Caja";
    "Caja_Movimientos" = "Movimientos de Caja";
    "Reportes_Ventas" = "Reporte de Ventas";
    "Reportes_Ganancias" = "Reporte de Ganancias";
    "Reportes_Clientes" = "Reporte de Clientes";
    "Reportes_Inventario" = "Reporte de Inventario";
    "Gastos_RegistrarGastos" = "Registrar Gastos";
    "Gastos_Categorias" = "Categorías de Gastos";
    "Gastos_Analisis" = "Análisis de Gastos";
    "Proveedores_CrearProveedor" = "Agregar Proveedores";
    "Proveedores_Compras" = "Gestionar Compras";
    "Proveedores_Pagos" = "Pagos a Proveedores";
    "Equipo_Usuarios" = "Gestionar Usuarios";
    "Equipo_Permisos" = "Asignar Permisos";
    "Equipo_Actividad" = "Monitorear Actividad";
    "Sucursales_CrearSucursal" = "Crear Sucursales";
    "Sucursales_Administrar" = "Administrar Sucursales";
    "PreciosPromos_Listas" = "Listas de Precios";
    "PreciosPromos_Promociones" = "Crear Promociones";
    "Configuracion_General" = "Configuración General";
    "Configuracion_Temas" = "Temas y Apariencia";
    "FAQ_Basicas" = "¿Por qué una tienda necesita software POS?";
    "FAQ_Seguridad" = "¿Es seguro usar Cuadra?";
    "FAQ_Soporte" = "¿Cómo obtengo soporte?";
}

$template = @'
import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function {NAME}Article() {{
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Aprende a usar {TITLE} en Cuadra para gestionar tu negocio de forma eficiente.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        {TITLE}
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Esta es una guía completa sobre cómo {TITLE_LOWER} en Cuadra.
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Característica principal
      </h3>

      <List
        items={{
          'Beneficio 1',
          'Beneficio 2',
          'Beneficio 3',
        }}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Cómo usar
      </h2>

      <Step number={{1}} title="Primer paso">
        Accede al módulo correspondiente desde el menú.
      </Step>

      <Step number={{2}} title="Segundo paso">
        Busca la opción de {TITLE_LOWER} en la pantalla.
      </Step>

      <Step number={{3}} title="Tercer paso">
        Completa la información necesaria y guarda los cambios.
      </Step>

      <Tip>
        <strong>Consejo útil:</strong> Puedes usar atajos de teclado para navegar más rápido en Cuadra.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Detalles importantes
      </h2>

      <InfoBox>
        <strong>Nota:</strong> Los cambios se guardan automáticamente en Cuadra, así que no necesitas hacer clic en un botón "Guardar" adicional.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas comunes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cómo...?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes encontrar esta información en el módulo correspondiente o contacta a soporte.
      </p>
    </>
  );
}}
'@

foreach ($article in $articles.GetEnumerator()) {
    $filename = $article.Key
    $title = $article.Value
    $titleLower = $title.ToLower()
    
    # Convert PascalCase to proper name
    $content = $template -replace '{NAME}', $filename
    $content = $content -replace '{TITLE}', $title
    $content = $content -replace '{TITLE_LOWER}', $titleLower
    
    Write-Host "Creating $filename.tsx"
}

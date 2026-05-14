import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Inventario_ImportarArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        La importación masiva de productos te permite cargar cientos o miles de productos
        en Cuadra de una sola vez usando un archivo CSV o Excel, en lugar de crearlos uno
        por uno. Ideal cuando estás comenzando con Cuadra o cuando recibes listas de
        productos de tus proveedores.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preparar el Archivo de Importación
      </h2>

      <Step number={1} title="Descarga la plantilla">
        Ve a <strong>Inventario → Importar</strong> y descarga la plantilla CSV de Cuadra.
        Esta plantilla tiene las columnas en el formato correcto.
      </Step>

      <Step number={2} title="Completa la plantilla">
        Llena la plantilla con tus productos. Las columnas principales son:
        <List
          items={[
            'nombre: nombre del producto (obligatorio)',
            'precio_venta: precio al público (obligatorio)',
            'costo: precio de compra al proveedor',
            'stock: cantidad inicial en inventario',
            'stock_minimo: umbral de alerta de reposición',
            'codigo_barras: código EAN o interno',
            'categoria: nombre de la categoría',
          ]}
        />
      </Step>

      <Step number={3} title="Guarda como CSV">
        Guarda el archivo en formato CSV con codificación UTF-8 para que los caracteres
        especiales (tildes, ñ) se muestren correctamente.
      </Step>

      <Tip>
        <strong>Usa la plantilla original:</strong> No cambies los nombres de las columnas
        en la plantilla. Cuadra las reconoce por nombre exacto. Si agregas columnas extra,
        serán ignoradas.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Importar el Archivo
      </h2>

      <Step number={1} title="Ve a Inventario → Importar">
        Busca la sección de importación en el módulo de inventario.
      </Step>

      <Step number={2} title="Sube el archivo">
        Arrastra el archivo CSV o haz clic en <strong>"Seleccionar archivo"</strong>
        para subirlo.
      </Step>

      <Step number={3} title="Previsualiza los datos">
        Cuadra mostrará una vista previa de los primeros registros para que verifiques
        que los datos se leyeron correctamente antes de importar.
      </Step>

      <Step number={4} title="Confirma la importación">
        Si todo se ve bien, haz clic en <strong>"Importar"</strong>. El proceso puede
        tomar unos segundos dependiendo de la cantidad de productos.
      </Step>

      <Step number={5} title="Revisa el resultado">
        Al terminar, Cuadra mostrará cuántos productos se importaron exitosamente y
        si hubo errores en alguna fila (con el motivo).
      </Step>

      <Warning>
        <strong>Productos duplicados:</strong> Si importas un producto con el mismo
        nombre o código de barras que uno ya existente, Cuadra puede duplicarlo o
        actualizar el existente según la configuración. Verifica las opciones de
        "Actualizar si existe" antes de confirmar la importación.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Errores Comunes en la Importación
      </h2>

      <List
        items={[
          'Formato de número incorrecto: usa punto (.) para decimales, no coma',
          'Caracteres especiales: asegúrate de guardar como UTF-8',
          'Columnas faltantes: el campo "nombre" y "precio_venta" son obligatorios',
          'Categoría no existente: crea la categoría primero o déjala vacía',
          'Stock negativo: el stock inicial no puede ser negativo',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Exportar el Inventario Actual
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        También puedes exportar tu inventario actual a CSV desde{' '}
        <strong>Inventario → Exportar</strong>. Útil para:
      </p>

      <List
        items={[
          'Tener un respaldo del catálogo completo',
          'Editar precios masivamente y reimportar',
          'Compartir el catálogo con proveedores',
          'Hacer análisis en Excel o Google Sheets',
        ]}
      />

      <InfoBox>
        <strong>Importación masiva de stock:</strong> Si ya tienes los productos creados
        y solo quieres actualizar el stock de todos (después de un conteo físico), también
        puedes usar la importación con solo las columnas de nombre/código y stock nuevo.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cuántos productos puedo importar a la vez?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No hay un límite estricto, pero archivos con más de 5.000 filas pueden tardar
        más en procesarse. Para catálogos muy grandes, considera dividir la importación
        en varios archivos más pequeños.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo importar solo actualizaciones de precio?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. Si el archivo tiene la columna de código de barras o nombre exacto y el campo
        de precio, puedes hacer una importación de actualización que solo modifique los
        precios sin tocar el stock ni otros datos.
      </p>
    </>
  );
}

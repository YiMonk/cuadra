import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Inventario_ProductosArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El inventario de productos es el corazón de tu negocio. Aquí aprenderás a crear, editar
        y organizar todos los artículos que vendes.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Crear un Producto Nuevo
      </h2>

      <Step number={1} title="Accede a Inventario">
        En el menú lateral, haz clic en <strong>Inventario → Gestión</strong>. Verás la lista de
        todos tus productos actuales.
      </Step>

      <Step number={2} title="Haz clic en 'Nuevo Producto'">
        Busca el botón <strong>"+ Nuevo Producto"</strong> o <strong>"Agregar"</strong> en la
        esquina superior derecha.
      </Step>

      <Step number={3} title="Completa la información básica">
        Llena los campos obligatorios:
        <List
          items={[
            'Nombre del producto (ej: "Agua Mineral 500ml")',
            'Precio de venta (precio al cliente)',
            'Costo (precio que tú pagas al proveedor)',
            'Stock inicial (cuántas unidades tienes ahora)',
          ]}
        />
      </Step>

      <Step number={4} title="Agrega información adicional (opcional)">
        Puedes completar también:
        <List
          items={[
            'Código de barras (para escanear en POS)',
            'Categoría (para organizar mejor tu catálogo)',
            'Descripción del producto',
            'Stock mínimo (para alertas de reposición)',
            'Proveedor habitual',
          ]}
        />
      </Step>

      <Step number={5} title="Guarda el producto">
        Haz clic en <strong>"Guardar"</strong> o <strong>"Crear"</strong>. El producto aparecerá
        inmediatamente en tu inventario y estará disponible en el POS.
      </Step>

      <Tip>
        <strong>Código de barras:</strong> Si tu producto no tiene código de barras impreso,
        puedes generar uno automáticamente en Cuadra. Es muy útil para agilizar las ventas.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Editar un Producto Existente
      </h2>

      <Step number={1} title="Busca el producto">
        En la lista de inventario, usa la barra de búsqueda o navega hasta encontrar el producto.
      </Step>

      <Step number={2} title="Abre el producto">
        Haz clic en el nombre del producto o en el ícono de editar (lápiz).
      </Step>

      <Step number={3} title="Modifica los campos">
        Cambia lo que necesites: precio, stock, descripción, categoría, etc.
      </Step>

      <Step number={4} title="Guarda los cambios">
        Haz clic en <strong>"Actualizar"</strong> o <strong>"Guardar"</strong>.
      </Step>

      <Warning>
        <strong>Cambio de precio:</strong> Si cambias el precio de un producto, este cambio
        aplica a ventas nuevas. Las ventas anteriores mantienen el precio original registrado.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Organizar con Categorías
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Las categorías te ayudan a organizar tu catálogo y filtrar productos más rápido en el
        POS. Ejemplos de categorías:
      </p>

      <List
        items={[
          'Bebidas',
          'Lácteos',
          'Limpieza',
          'Snacks',
          'Farmacia',
          'Electrónica',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4 mb-4">
        Para crear categorías, ve a <strong>Inventario → Categorías</strong> y haz clic en{' '}
        <strong>"Nueva Categoría"</strong>.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Eliminar un Producto
      </h2>

      <Step number={1} title="Abre el producto">
        Encuentra el producto que quieres eliminar en la lista.
      </Step>

      <Step number={2} title="Accede a las opciones">
        Haz clic en los tres puntos (⋮) o en el botón de eliminar (papelera).
      </Step>

      <Step number={3} title="Confirma la eliminación">
        Cuadra te pedirá confirmación antes de eliminar.
      </Step>

      <Warning>
        <strong>Atención:</strong> Eliminar un producto no borra el historial de ventas donde
        apareció. Si solo quieres ocultarlo temporalmente, considera desactivarlo en lugar de
        eliminarlo.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Buscar y Filtrar Productos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En la lista de inventario puedes:
      </p>

      <List
        items={[
          'Buscar por nombre o código de barras',
          'Filtrar por categoría',
          'Filtrar por estado (activo/inactivo)',
          'Filtrar por stock bajo',
          'Ordenar por precio, nombre, o stock',
        ]}
      />

      <InfoBox>
        <strong>Exportar inventario:</strong> Puedes exportar tu lista completa de productos a
        CSV para hacer análisis externas o respaldos.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cuántos productos puedo tener?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra no tiene límite en la cantidad de productos. Puedes tener desde 10 hasta miles de
        productos.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo tener un producto con stock negativo?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No. Si intentas vender más unidades de las disponibles, Cuadra te mostrará una alerta.
        Puedes configurar si permite o bloquea la venta en esa situación.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo tener variantes del mismo producto?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Por el momento, Cuadra maneja cada variante como un producto separado. Por ejemplo,
        "Camiseta Roja Talla S" y "Camiseta Roja Talla M" serían dos productos distintos.
      </p>
    </>
  );
}

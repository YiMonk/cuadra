import React from 'react';
import { Step, Tip, Warning, Success, Kbd, List, InfoBox } from '@/components/wiki/WikiArticleRenderer';

export default function CrearVentaArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El Punto de Venta (POS) es el corazón de Cuadra. Aquí aprenderás cómo crear una venta
        desde cero.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Accediendo al POS
      </h2>

      <Step number={1} title="Ve a Ventas">
        En la barra lateral o menú, haz clic en <strong>"Ventas"</strong> o el icono del carrito
        de compras.
      </Step>

      <Step number={2} title="Comienza una nueva venta">
        Si no hay una venta activa, verás un carrito vacío y un botón{' '}
        <strong>"Nueva Venta"</strong>. Haz clic en él.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Agregando Productos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Hay varias formas de agregar productos a una venta:
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Opción 1: Buscar por nombre
      </h3>

      <Step number={1} title="Haz clic en el campo de búsqueda">
        En el POS, verás un campo que dice "Buscar producto..."
      </Step>

      <Step number={2} title="Escribe el nombre del producto">
        Comienza a escribir el nombre del producto que quieres vender. Verás sugerencias aparecer.
      </Step>

      <Step number={3} title="Selecciona el producto">
        Haz clic en el producto correcto de la lista.
      </Step>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Opción 2: Escanear código de barras
      </h3>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Si tienes un escáner de código de barras conectado:
      </p>

      <Step number={1} title="Enfoca el lector de código">
        Apunta el escáner al código de barras del producto.
      </Step>

      <Step number={2} title="El producto se agregará automáticamente">
        Cuadra busca el código y lo agrega al carrito automáticamente.
      </Step>

      <Tip>
        <strong>Escáner recomendado:</strong> Usa un lector USB de código de barras. La mayoría
        funcionan inmediatamente sin necesidad de configuración.
      </Tip>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Opción 3: Seleccionar de la lista
      </h3>

      <Step number={1} title="Abre la lista de productos">
        Haz clic en <strong>"Ver Catálogo"</strong> o <strong>"Todos los Productos"</strong>.
      </Step>

      <Step number={2} title="Navega y selecciona">
        Busca el producto en la lista y haz clic en él.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ajustando Cantidades y Precios
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Una vez que agregas un producto, puedes ajustar su cantidad y precio:
      </p>

      <Step number={1} title="Modifica la cantidad">
        Haz clic en el campo de cantidad y cambia el número. Por ejemplo, si el cliente compra 3
        unidades, cambia de 1 a 3.
      </Step>

      <Step number={2} title="Ajusta el precio si es necesario">
        Si necesitas cambiar el precio unitario, haz clic en el precio y edítalo.
      </Step>

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        El total se actualiza automáticamente con tus cambios.
      </p>

      <Warning>
        <strong>Importante:</strong> Los cambios de precio solo afectan esta venta, no el precio
        general del producto.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Eliminando Productos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Si agregas un producto por error:
      </p>

      <Step number={1} title="Busca el producto en el carrito">
        Desplázate en tu carrito y encuentra el producto equivocado.
      </Step>

      <Step number={2} title="Haz clic en eliminar o cruza">
        Busca el icono de X o papelera junto al producto y haz clic.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Aplicando Descuentos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Antes de cobrar, puedes aplicar descuentos:
      </p>

      <Step number={1} title="Busca la opción de descuentos">
        En el resumen de la venta, haz clic en <strong>"Agregar Descuento"</strong>.
      </Step>

      <Step number={2} title="Elige el tipo de descuento">
        Puedes aplicar un descuento por porcentaje (%) o monto fijo.
      </Step>

      <Step number={3} title="Ingresa el valor">
        Escribe el porcentaje o monto del descuento.
      </Step>

      <InfoBox>
        También puedes aplicar códigos de cupones si tienes promociones activas. Busca el campo
        "Código de Cupón" en la pantalla de pago.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Seleccionando Cliente
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Es útil registrar a qué cliente le estás vendiendo:
      </p>

      <Step number={1} title="Haz clic en 'Cliente'">
        En el POS, verás un campo o botón para seleccionar cliente.
      </Step>

      <Step number={2} title="Busca o crea un cliente">
        Si el cliente existe, búscalo por nombre. Si es nuevo, haz clic en{' '}
        <strong>"Agregar Cliente"</strong>.
      </Step>

      <Tip>
        <strong>Beneficio:</strong> Registrar clientes te ayuda a llevar un historial de sus
        compras y controlar si tienen deudas pendientes.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Seleccionando Método de Pago
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Antes de finalizar, elige cómo pagará el cliente:
      </p>

      <Step number={1} title="Haz clic en 'Método de Pago'">
        En la sección de pago, verás opciones disponibles.
      </Step>

      <Step number={2} title="Selecciona una opción">
        Puedes elegir:
        <List
          items={[
            'Efectivo',
            'Transferencia bancaria',
            'Tarjeta de crédito/débito',
            'Billeteras digitales',
            'Crédito (si el cliente tiene ese tipo de cuenta)',
          ]}
        />
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Finalizando la Venta
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Una vez que verificaste todo:
      </p>

      <Step number={1} title="Revisa el total">
        Asegúrate de que el monto total sea correcto.
      </Step>

      <Step number={2} title="Haz clic en 'Cobrar' o 'Finalizar'">
        Busca el botón principal que completa la transacción.
      </Step>

      <Step number={3} title="Procesa el pago">
        Según el método, puede que debas confirmar el pago (ingresar dinero en efectivo,
        confirmar transferencia, etc.).
      </Step>

      <Success>
        ¡Venta completada! El producto se deducirá del inventario automáticamente, y el cliente
        recibirá un recibo digital.
      </Success>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Después de la Venta
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Una vez completada, puedes:
      </p>

      <List
        items={[
          'Imprimir o enviar el recibo',
          'Enviar el recibo por WhatsApp o correo',
          'Comenzar una nueva venta',
          'Cerrar tu sesión de caja al final del día',
        ]}
      />

      <Tip>
        <strong>Consejo de eficiencia:</strong> Si vendes muchos productos similares, considera
        crear paquetes o productos agrupados para ahorrar tiempo.
      </Tip>
    </>
  );
}

import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function POS_DescuentosCuponesArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Cuadra permite aplicar descuentos directamente en el POS durante una venta, ya sea
        manualmente sobre un producto o sobre el total, o mediante cupones de descuento
        configurados previamente.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Aplicar un Descuento Manual
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes dar un descuento sobre un producto específico o sobre el total de la venta.
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Descuento en un producto
      </h3>

      <Step number={1} title="Agrega el producto al carrito">
        Escanea o busca el producto normalmente.
      </Step>

      <Step number={2} title="Toca el producto en el carrito">
        Haz clic en el producto ya agregado para ver sus opciones.
      </Step>

      <Step number={3} title="Aplica el descuento">
        Busca la opción <strong>"Descuento"</strong> o el ícono de porcentaje. Ingresa
        el porcentaje (ej: 10%) o el monto fijo a descontar.
      </Step>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        Descuento sobre el total
      </h3>

      <Step number={1} title="Agrega todos los productos">
        Completa el carrito con todos los artículos de la venta.
      </Step>

      <Step number={2} title="Aplica descuento global">
        En la pantalla de cobro, busca <strong>"Descuento sobre total"</strong>.
        Ingresa el porcentaje o monto a descontar del total.
      </Step>

      <Tip>
        <strong>Permiso de descuento:</strong> Por seguridad, puedes configurar que solo
        ciertos roles (administrador o supervisor) puedan aplicar descuentos manuales.
        El personal de caja sin este permiso no verá la opción.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Usar Cupones de Descuento
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Los cupones son códigos preconfigurados que aplican descuentos automáticamente.
        Para crearlos ve a <strong>Precios & Promos → Cupones</strong>.
      </p>

      <Step number={1} title="Agrega los productos al carrito">
        Completa la venta normalmente.
      </Step>

      <Step number={2} title="Ingresa el código de cupón">
        En la pantalla de cobro, busca el campo <strong>"Código de cupón"</strong> o{' '}
        <strong>"¿Tienes un cupón?"</strong>. Escribe o escanea el código.
      </Step>

      <Step number={3} title="Verifica el descuento aplicado">
        Cuadra mostrará el descuento calculado y el nuevo total. Verifica que sea correcto
        antes de confirmar el pago.
      </Step>

      <Step number={4} title="Confirma el pago">
        Procede con el método de pago elegido. El cupón se marca como usado si es de
        uso único, o se descuenta del contador si tiene límite de usos.
      </Step>

      <Warning>
        <strong>Cupones expirados o agotados:</strong> Si el código no aplica, Cuadra mostrará
        el motivo: cupón inválido, expirado, ya fue usado, o no aplica a los productos
        del carrito.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Tipos de Descuentos Disponibles
      </h2>

      <List
        items={[
          'Porcentaje: descuenta X% del precio (ej: 15% de descuento)',
          'Monto fijo: descuenta una cantidad exacta (ej: $500 de descuento)',
          'Precio especial: establece un precio fijo para el producto (ej: "a $990 hoy")',
          '2x1 o promociones de cantidad: se configuran en Precios & Promos',
        ]}
      />

      <InfoBox>
        <strong>Registro de descuentos:</strong> Todos los descuentos aplicados quedan
        registrados en el detalle de la venta. En los reportes puedes ver cuánto has
        descontado en un período y qué impacto tiene en tus márgenes.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo acumular varios descuentos en una misma venta?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Depende de la configuración. Por defecto, un cupón y un descuento manual no se
        acumulan. Puedes configurar el comportamiento en <strong>Precios & Promos</strong>.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Los descuentos afectan el stock?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        No. El descuento solo afecta el precio de venta. El stock se descuenta normalmente
        según la cantidad vendida, independientemente del descuento aplicado.
      </p>
    </>
  );
}

import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function PreciosPromos_PromocionesArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Las promociones en Cuadra son reglas automáticas que aplican descuentos o condiciones
        especiales cuando se cumplen ciertos criterios durante una venta. A diferencia de
        los descuentos manuales, las promociones se activan solas sin que el cajero tenga
        que hacer nada.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Tipos de Promociones Disponibles
      </h2>

      <List
        items={[
          '2x1: lleva 2 unidades y paga 1',
          '3x2: lleva 3 y paga 2',
          'Descuento por cantidad: al comprar X unidades, aplica Y% de descuento',
          'Descuento por monto total: si el ticket supera $X, se aplica un descuento',
          'Precio especial temporal: un producto tiene un precio fijo por período',
          'Combo: precio especial al comprar dos productos juntos',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Crear una Promoción
      </h2>

      <Step number={1} title="Ve a Precios & Promos → Promociones">
        Accede al módulo de promociones desde el menú lateral.
      </Step>

      <Step number={2} title="Haz clic en 'Nueva Promoción'">
        Busca el botón <strong>"+ Nueva Promoción"</strong>.
      </Step>

      <Step number={3} title="Define el nombre y tipo">
        Ponle un nombre descriptivo (ej: "2x1 en bebidas mayo") y selecciona el tipo de
        promoción.
      </Step>

      <Step number={4} title="Configura las condiciones">
        Según el tipo elegido, define:
        <List
          items={[
            'Qué productos o categorías aplican',
            'La cantidad o monto necesario para activar la promo',
            'El descuento o beneficio aplicado',
          ]}
        />
      </Step>

      <Step number={5} title="Define la vigencia">
        Ingresa la fecha de inicio y fin de la promoción. Cuadra la activará y desactivará
        automáticamente según las fechas configuradas.
      </Step>

      <Step number={6} title="Guarda y activa">
        Haz clic en <strong>"Guardar"</strong>. Activa la promoción si ya está vigente o
        déjala programada para que se active en la fecha de inicio.
      </Step>

      <Tip>
        <strong>Nombra bien tus promociones:</strong> Usa nombres descriptivos con la fecha
        o período: "2x1 Bebidas Mayo 2025". Facilita identificar qué promo se aplicó al
        revisar reportes históricos.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Cómo se Aplican las Promociones en el POS
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Las promociones activas se aplican automáticamente cuando se cumplen las condiciones:
      </p>

      <List
        items={[
          'El cajero agrega los productos al carrito normalmente',
          'Cuando se cumple la condición (ej: 2 unidades del producto), Cuadra aplica el beneficio',
          'El carrito muestra el descuento con la etiqueta de la promo aplicada',
          'El cajero puede ver qué promoción se activó',
        ]}
      />

      <Warning>
        <strong>Conflicto entre promociones:</strong> Si hay varias promociones que aplican
        a los mismos productos, Cuadra aplica la que da mayor beneficio al cliente, a menos
        que hayas configurado una prioridad específica.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Reporte de Efectividad de Promociones
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En <strong>Reportes → Promociones</strong> puedes ver el impacto de cada promo:
      </p>

      <List
        items={[
          'Cuántas veces se aplicó la promoción',
          'Total de descuentos otorgados',
          'Ventas generadas durante la vigencia de la promo',
          'Comparativa de ventas del producto antes y durante la promo',
        ]}
      />

      <InfoBox>
        <strong>Cupones de descuento:</strong> Para promociones que el cliente activa
        con un código especial (como "PROMO20"), usa los <strong>Cupones</strong> en lugar
        de Promociones automáticas. Los cupones requieren que el cajero ingrese el código
        manualmente, lo que da más control sobre quién los usa.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Una promoción puede aplicar solo a algunos clientes?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Las promociones generales aplican a todos. Si quieres una promo solo para clientes
        VIP, usa listas de precios especiales con el descuento incorporado, o crea cupones
        que solo compartes con esos clientes.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo pausar una promoción sin eliminarla?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí. Puedes desactivar una promoción en cualquier momento para pausarla y volverla
        a activar cuando la necesites, sin perder su configuración.
      </p>
    </>
  );
}

import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function PreciosPromos_ListasArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Las listas de precios permiten tener diferentes precios para los mismos productos
        según el tipo de cliente. Por ejemplo, un precio para el público general y un precio
        especial para mayoristas o clientes VIP. Cuadra aplica la lista correcta automáticamente
        al cliente asignado en el POS.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        ¿Para Qué Sirven las Listas de Precios?
      </h2>

      <List
        items={[
          'Precio mayorista para clientes que compran en volumen',
          'Precio especial para clientes VIP o frecuentes',
          'Precio diferente por sucursal (un local en zona premium puede cobrar más)',
          'Precio promocional por temporada sin modificar el precio base',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Crear una Lista de Precios
      </h2>

      <Step number={1} title="Ve a Precios & Promos → Listas de Precios">
        Accede desde el menú lateral a la sección de precios.
      </Step>

      <Step number={2} title="Haz clic en 'Nueva Lista'">
        Busca el botón <strong>"+ Nueva Lista de Precios"</strong>.
      </Step>

      <Step number={3} title="Define el nombre y tipo">
        Ponle un nombre descriptivo: "Mayorista", "VIP", "Sucursal Norte", etc.
        Elige el tipo de ajuste:
        <List
          items={[
            'Porcentaje sobre el precio base (ej: 15% de descuento para mayoristas)',
            'Precios fijos por producto (defines el precio uno a uno)',
          ]}
        />
      </Step>

      <Step number={4} title="Configura los precios">
        Si elegiste porcentaje, ingresa el descuento. Si elegiste precios fijos, define
        el precio de cada producto incluido en la lista.
      </Step>

      <Step number={5} title="Guarda la lista">
        Haz clic en <strong>"Guardar"</strong>. La lista estará disponible para asignarla
        a clientes o sucursales.
      </Step>

      <Tip>
        <strong>Lista por porcentaje:</strong> Si creas una lista de "Mayorista" con 20%
        de descuento sobre el precio base, cuando cambies el precio base de un producto,
        el precio mayorista se actualiza automáticamente. No necesitas actualizar cada lista
        por separado.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Asignar una Lista a un Cliente
      </h2>

      <Step number={1} title="Abre el perfil del cliente">
        Ve a <strong>Clientes</strong> y abre el cliente al que quieres asignar
        una lista especial.
      </Step>

      <Step number={2} title="Edita el cliente">
        Haz clic en <strong>"Editar"</strong> y busca el campo{' '}
        <strong>"Lista de precios"</strong>.
      </Step>

      <Step number={3} title="Selecciona la lista">
        Elige la lista de precios de la lista desplegable y guarda.
      </Step>

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Desde ahora, cada vez que ese cliente sea seleccionado en el POS, Cuadra aplicará
        automáticamente sus precios especiales.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Asignar una Lista a una Sucursal
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        También puedes asignar una lista de precios a una sucursal completa, de modo que
        todas las ventas de ese local usen esos precios:
      </p>

      <p className="text-slate-700 dark:text-slate-300">
        Ve a <strong>Configuración → Sucursales → [sucursal] → Lista de precios</strong> y
        selecciona la lista a aplicar.
      </p>

      <InfoBox>
        <strong>Prioridad de listas:</strong> Si un cliente tiene una lista asignada Y
        la sucursal también tiene una lista, la lista del cliente tiene prioridad.
        Cuadra siempre aplica el precio más específico disponible.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo tener precios distintos para cada producto en una lista?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Con el tipo "Precios fijos" puedes definir un precio específico para cada
        producto. Con "Porcentaje" se aplica el mismo descuento a todos los productos.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El cajero ve los precios especiales o solo el precio final?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        El cajero ve directamente el precio de la lista aplicada para el cliente seleccionado.
        No necesita calcular descuentos manualmente — el sistema lo hace solo.
      </p>
    </>
  );
}

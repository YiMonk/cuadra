import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Proveedores_CrearProveedorArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Registrar tus proveedores en Cuadra te permite asociar compras de mercadería a
        cada uno, llevar el historial de pedidos, controlar cuánto les debes y comparar
        condiciones entre distintos proveedores.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Crear un Proveedor Nuevo
      </h2>

      <Step number={1} title="Ve al módulo de Proveedores">
        En el menú lateral, haz clic en <strong>Proveedores</strong>. Verás la lista de
        proveedores registrados.
      </Step>

      <Step number={2} title="Haz clic en 'Nuevo Proveedor'">
        Busca el botón <strong>"+ Nuevo Proveedor"</strong> o <strong>"Agregar"</strong>.
      </Step>

      <Step number={3} title="Completa los datos del proveedor">
        Llena la información:
        <List
          items={[
            'Nombre de la empresa o persona (obligatorio)',
            'Nombre del contacto principal',
            'Teléfono o celular',
            'Correo electrónico',
            'Dirección',
          ]}
        />
      </Step>

      <Step number={4} title="Información comercial (opcional)">
        Puedes agregar:
        <List
          items={[
            'RUT o número de identificación fiscal',
            'Condiciones de pago (contado, 30 días, etc.)',
            'Notas adicionales (horarios de entrega, mínimo de pedido, etc.)',
          ]}
        />
      </Step>

      <Step number={5} title="Guarda el proveedor">
        Haz clic en <strong>"Guardar"</strong>. El proveedor estará disponible para
        asociarlo a productos y compras.
      </Step>

      <Tip>
        <strong>Vincula productos al proveedor:</strong> Una vez creado el proveedor,
        puedes editar tus productos del inventario y asignarles el proveedor habitual.
        Esto facilita hacer los pedidos y entender de dónde viene cada producto.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Editar un Proveedor
      </h2>

      <Step number={1} title="Busca el proveedor">
        En la lista de proveedores, busca por nombre.
      </Step>

      <Step number={2} title="Abre su perfil">
        Haz clic en el nombre para ver el perfil completo del proveedor.
      </Step>

      <Step number={3} title="Edita los datos">
        Haz clic en <strong>"Editar"</strong>, modifica lo que necesites y guarda.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Qué Ver en el Perfil de un Proveedor
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En el perfil de cada proveedor encontrarás:
      </p>

      <List
        items={[
          'Datos de contacto y condiciones comerciales',
          'Historial de compras realizadas (fecha, productos, montos)',
          'Total comprado al proveedor en el período',
          'Deudas pendientes con el proveedor',
          'Productos asociados a este proveedor',
        ]}
      />

      <InfoBox>
        <strong>Comparar proveedores:</strong> Si tienes el mismo producto disponible
        con varios proveedores (y registras el costo en cada compra), podrás comparar
        quién te ofrece mejor precio histórico desde los reportes de proveedores.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo tener varios proveedores para el mismo producto?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Un producto puede tener un proveedor "habitual" asignado, pero puedes registrar
        compras del mismo producto con distintos proveedores sin problema.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo eliminar un proveedor?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Puedes desactivarlo para que no aparezca en el selector al registrar compras,
        pero el historial de compras previas se mantiene para no perder el registro.
      </p>
    </>
  );
}

import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Clientes_CrearClienteArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Registrar clientes en Cuadra te permite venderles a crédito, hacer seguimiento de
        sus compras, aplicarles listas de precios especiales y entender quiénes son tus
        mejores compradores.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Crear un Cliente Nuevo
      </h2>

      <Step number={1} title="Ve al módulo de Clientes">
        En el menú lateral, haz clic en <strong>Clientes</strong>. Verás la lista de
        todos tus clientes registrados.
      </Step>

      <Step number={2} title="Haz clic en 'Nuevo Cliente'">
        Busca el botón <strong>"+ Nuevo Cliente"</strong> o <strong>"Agregar"</strong> en
        la esquina superior derecha.
      </Step>

      <Step number={3} title="Completa la información básica">
        Llena los campos del formulario:
        <List
          items={[
            'Nombre completo o nombre del negocio (obligatorio)',
            'Teléfono o celular de contacto',
            'Correo electrónico',
            'Dirección (útil para entregas o facturación)',
          ]}
        />
      </Step>

      <Step number={4} title="Configura opciones adicionales">
        Opcionalmente puedes:
        <List
          items={[
            'Asignar una lista de precios especial para este cliente',
            'Definir un límite de crédito máximo',
            'Agregar notas o etiquetas (tags) para categorizar al cliente',
            'Indicar el RUT o número de identificación fiscal',
          ]}
        />
      </Step>

      <Step number={5} title="Guarda el cliente">
        Haz clic en <strong>"Guardar"</strong>. El cliente quedará disponible en el POS
        para asignarle ventas y fiados.
      </Step>

      <Tip>
        <strong>Desde el POS:</strong> También puedes crear un cliente nuevo directamente
        durante una venta. Al seleccionar "Asignar cliente" en el POS, tendrás la opción
        de crear uno nuevo sin salir del proceso de venta.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Editar un Cliente
      </h2>

      <Step number={1} title="Busca el cliente">
        En la lista de clientes, usa la barra de búsqueda por nombre, teléfono o correo.
      </Step>

      <Step number={2} title="Abre su perfil">
        Haz clic en el nombre del cliente para abrir su perfil completo.
      </Step>

      <Step number={3} title="Edita y guarda">
        Haz clic en <strong>"Editar"</strong>, modifica los campos necesarios y guarda.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Etiquetas y Segmentación
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes agregar etiquetas (tags) a tus clientes para segmentarlos y filtrarlos
        fácilmente. Ejemplos de etiquetas útiles:
      </p>

      <List
        items={[
          '"mayorista" — clientes que compran al por mayor',
          '"vip" — clientes con beneficios especiales',
          '"crédito" — clientes a los que vendes fiado',
          '"delivery" — clientes que piden a domicilio',
        ]}
      />

      <Warning>
        <strong>Datos reales:</strong> Registra datos de contacto reales y actualizados.
        Si vendes a crédito, necesitarás poder contactar al cliente para cobrar.
      </Warning>

      <InfoBox>
        <strong>Exportar clientes:</strong> Desde <strong>Clientes → Exportar</strong>
        puedes descargar la lista completa en CSV para campañas de marketing por WhatsApp
        o correo, o para llevar un respaldo externo.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo vender sin asignar un cliente?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. El cliente es opcional en el POS. Solo es obligatorio cuando la venta es a
        crédito (fiado), ya que necesitas saber a quién se le debe el pago.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cuántos clientes puedo registrar?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No hay límite en la cantidad de clientes que puedes registrar en Cuadra.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo eliminar un cliente?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Sí, pero solo si no tiene deudas pendientes ni historial de ventas activo. Si tiene
        historial, considera desactivarlo en lugar de eliminarlo para conservar el registro.
      </p>
    </>
  );
}

import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Configuracion_GeneralArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        La configuración general de Cuadra define los datos básicos de tu negocio, las
        preferencias de funcionamiento y los parámetros que afectan a toda la aplicación.
        Solo los propietarios y administradores pueden modificarla.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Acceder a la Configuración
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ve a <strong>Configuración</strong> en el menú lateral o haz clic en tu nombre/foto
        de perfil en la parte inferior del menú y selecciona <strong>"Configuración"</strong>.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Datos del Negocio
      </h2>

      <Step number={1} title="Ve a Configuración → General">
        Encuentra la sección con los datos básicos del negocio.
      </Step>

      <Step number={2} title="Actualiza la información">
        Puedes modificar:
        <List
          items={[
            'Nombre del negocio',
            'Logo (se muestra en comprobantes y reportes)',
            'Dirección y teléfono de contacto',
            'Correo electrónico del negocio',
            'RUT o número de identificación fiscal',
          ]}
        />
      </Step>

      <Step number={3} title="Guarda los cambios">
        Haz clic en <strong>"Guardar"</strong>. Los cambios se reflejan inmediatamente
        en los comprobantes y documentos que genera Cuadra.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Configuración del POS
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Ajusta cómo funciona el punto de venta:
      </p>

      <List
        items={[
          'Permitir ventas con stock negativo: sí/no',
          'Solicitar cliente en cada venta: obligatorio u opcional',
          'Imprimir comprobante automáticamente al finalizar venta',
          'Mostrar foto de los productos en el POS',
          'Activar búsqueda por código de barras',
        ]}
      />

      <Tip>
        <strong>Ventas con stock negativo:</strong> Si deshabilitas esta opción, Cuadra
        bloqueará las ventas cuando el stock llegue a cero. Si la habilitas, permitirá
        seguir vendiendo pero mostrará una alerta. Recomendamos deshabilitarla para
        mantener el inventario preciso.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Configuración de Impuestos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Define si tus precios incluyen o no impuestos:
      </p>

      <List
        items={[
          'Precios con IVA incluido: el precio del producto ya incluye el impuesto',
          'Precios sin IVA: Cuadra añade el impuesto al momento de cobrar',
          'Negocio exento de IVA: sin cálculo de impuesto',
        ]}
      />

      <Warning>
        <strong>Cambiar la configuración de IVA:</strong> Si cambias si los precios incluyen
        o no IVA, esto afecta el cálculo de todos los tickets. Asegúrate de actualizar
        también los precios de tus productos para que sean coherentes con la nueva configuración.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Moneda y Formato de Números
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Configura el símbolo de moneda y el formato numérico según tu país:
      </p>

      <List
        items={[
          'Símbolo de moneda: $, €, S/, etc.',
          'Separador de miles: punto o coma',
          'Decimales en precios: 0, 2 o más',
        ]}
      />

      <InfoBox>
        <strong>Comprobantes personalizados:</strong> Puedes personalizar el texto que
        aparece en los tickets de venta: mensaje de agradecimiento, políticas de devolución,
        redes sociales o cualquier información que quieras incluir.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Quién puede cambiar la configuración general?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Solo los usuarios con rol de <strong>Propietario</strong> o{' '}
        <strong>Administrador</strong>. El personal de caja no tiene acceso a la configuración.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Los cambios en la configuración afectan ventas pasadas?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        No. Los cambios aplican solo a las operaciones nuevas. Las ventas históricas
        mantienen los parámetros con los que fueron registradas.
      </p>
    </>
  );
}

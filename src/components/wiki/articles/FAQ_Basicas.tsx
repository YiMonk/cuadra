import React from 'react';
import { InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function FAQ_BasicasArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Respuestas a las preguntas más comunes sobre el uso general de Cuadra. Si no
        encuentras lo que buscas aquí, revisa la sección de la wiki correspondiente al
        módulo que necesitas o contacta a soporte.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas Generales
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cuadra funciona sin internet?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra requiere conexión a internet para sincronizar datos en tiempo real. Sin
        embargo, como PWA (aplicación web progresiva), puede funcionar en modo limitado
        mientras estás sin conexión y sincronizará los cambios cuando vuelva la conectividad.
        Para operación crítica, recomendamos una conexión estable.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿En qué dispositivos puedo usar Cuadra?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra funciona en cualquier dispositivo con navegador web moderno:
        computadoras (Windows, Mac), tablets y celulares (iOS y Android). También puedes
        instalarlo como app desde el navegador en dispositivos móviles.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo usar Cuadra en varios dispositivos al mismo tiempo?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Puedes tener Cuadra abierto en múltiples dispositivos simultáneamente. Los datos
        se sincronizan en tiempo real entre todos los dispositivos conectados.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cómo hago una copia de seguridad de mis datos?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Tus datos se almacenan automáticamente en la nube con copias de seguridad diarias.
        No necesitas hacer nada. Adicionalmente, puedes exportar tus datos (ventas, inventario,
        clientes) a CSV desde los módulos respectivos en cualquier momento.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo cancelar mi suscripción?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Puedes cancelar tu suscripción desde <strong>Configuración → Suscripción</strong>
        en cualquier momento. Tu cuenta permanecerá activa hasta el final del período pagado.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas sobre el Inventario
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Hay un límite de productos?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No. Cuadra no tiene límite en la cantidad de productos que puedes tener en el inventario.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿El stock se actualiza automáticamente al vender?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. Cada venta descuenta automáticamente las unidades vendidas del inventario.
        No necesitas actualizar el stock manualmente después de cada venta.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas sobre Ventas
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo emitir facturas o boletas electrónicas?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra genera comprobantes de venta (tickets). Para facturación electrónica oficial
        según la normativa de tu país, consulta con nuestro equipo de soporte sobre las
        integraciones disponibles.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo vender sin asignar cliente?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí. El cliente es opcional en el POS, excepto para ventas a crédito (fiado) donde
        es obligatorio saber a quién se le debe el pago.
      </p>

      <InfoBox>
        <strong>¿Tienes más preguntas?</strong> Explora las otras secciones de la wiki
        para encontrar guías detalladas de cada módulo. Si tu pregunta no está respondida,
        contacta a nuestro equipo de soporte desde <strong>Configuración → Soporte</strong>.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Funcionalidades de Cuadra de un Vistazo
      </h2>

      <List
        items={[
          'Punto de Venta (POS) con múltiples métodos de pago',
          'Gestión de inventario con control de stock en tiempo real',
          'Clientes y sistema de crédito (fiado)',
          'Caja con sesiones y arqueos',
          'Reportes de ventas, ganancias y más',
          'Registro de gastos operacionales',
          'Gestión de proveedores y compras',
          'Múltiples sucursales desde una sola cuenta',
          'Listas de precios y promociones automáticas',
          'Equipo con roles y permisos granulares',
        ]}
      />
    </>
  );
}

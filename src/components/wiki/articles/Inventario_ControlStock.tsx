import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Inventario_ControlStockArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Aprende sobre Control de Stock en Cuadra y cómo usarlo en tu negocio.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Control de Stock
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Esta guía te enseña a usar control de stock de forma eficiente en Cuadra.
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        ¿Qué es?
      </h3>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Control de Stock es una característica importante que te permite gestionar mejor tu negocio.
      </p>

      <List
        items={[
          'Ventaja 1',
          'Ventaja 2',
          'Ventaja 3',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Cómo usar
      </h2>

      <Step number={1} title="Accede al módulo">
        Desde el menú principal, busca la sección correspondiente.
      </Step>

      <Step number={2} title="Busca la opción">
        Encuentra la opción para control de stock en la pantalla.
      </Step>

      <Step number={3} title="Completa y guarda">
        Llena la información necesaria y guarda tus cambios.
      </Step>

      <Tip>
        <strong>Consejo:</strong> Cuadra guarda automáticamente tus cambios, así que no necesitas hacer clic en un botón adicional.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Detalles importantes
      </h2>

      <InfoBox>
        <strong>Recuerda:</strong> Todos los cambios en Cuadra se sincronizan en tiempo real, así que verás las actualizaciones inmediatamente.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo deshacer cambios?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Sí, dependiendo del tipo de cambio. Contacta a soporte si necesitas ayuda.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Hay limitaciones?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        No hay limitaciones prácticas para usar control de stock en Cuadra.
      </p>
    </>
  );
}

import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

// This is a template article - copy and modify for new articles
export default function TemplateArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Aquí va la descripción introductoria del tema. Explica brevemente de qué trata este
        artículo.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Sección Principal
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Explica el concepto o proceso en términos simples.
      </p>

      <List items={['Punto 1 del tema', 'Punto 2 del tema', 'Punto 3 del tema']} />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Cómo Usar
      </h2>

      <Step number={1} title="Primer paso">Describe el primer paso del proceso.</Step>

      <Step number={2} title="Segundo paso">Describe el segundo paso del proceso.</Step>

      <Step number={3} title="Tercer paso">Describe el tercer paso del proceso.</Step>

      <Tip>
        <strong>Consejo útil:</strong> Aquí va un consejo o mejor práctica relacionada al tema.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Detalles Adicionales
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Información adicional, mejores prácticas, o consideraciones especiales.
      </p>

      <InfoBox>
        <strong>Nota importante:</strong> Información que el usuario debe saber o recordar.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas Frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Pregunta 1?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">Respuesta a la pregunta 1.</p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Pregunta 2?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">Respuesta a la pregunta 2.</p>
    </>
  );
}

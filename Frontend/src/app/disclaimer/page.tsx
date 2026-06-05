import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso Legal y Disclaimer - Cuadra',
  description: 'Aviso legal y disclaimer de Cuadra',
};

export default function DisclaimerPage() {
  return (
    <article className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">⚖️ Aviso Legal y Disclaimer</h1>

      <div className="prose prose-invert max-w-none dark:prose-invert space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">Sobre Cuadra</h2>
          <p>
            <strong>Cuadra</strong> es una herramienta de <strong>gestión empresarial, control de inventario y análisis de operaciones</strong>.
          </p>
          <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
            NO es un sistema de facturación fiscal autorizado, ni un POS registrado ante el SENIAT, ni reemplaza obligaciones fiscales o legales de tu negocio.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Responsabilidades del usuario</h2>

          <h3 className="text-xl font-semibold mb-3">Cumplimiento fiscal y legal</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Tú eres responsable</strong> de cumplir con todas las leyes fiscales, tributarias, laborales y comerciales de tu jurisdicción</li>
            <li>Los reportes y registros de Cuadra son <strong>únicamente para referencia interna y gestión operativa</strong></li>
            <li>Si tu negocio está obligado a registrarse ante el SENIAT u otras autoridades, <strong>debes hacerlo independientemente</strong> de usar Cuadra</li>
            <li>Cuadra no reemplaza ni exime de cumplir con regulaciones locales</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Registros y documentación</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Los datos registrados en Cuadra son <strong>internos y propios de tu negocio</strong></li>
            <li>Si eres obligado a mantener registros fiscales oficiales, <strong>debes mantenerlos separados</strong> de Cuadra</li>
            <li>Los reportes generados en Cuadra no son documentos fiscales ni pueden ser presentados a autoridades como tales</li>
            <li>La responsabilidad de mantener registros legales recae completamente en ti</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Datos y privacidad</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Los datos de tu negocio se almacenan en servidores en la nube (Google Cloud/Firebase)</li>
            <li>Cuadra tiene acceso a tus datos operacionales; revisa nuestra Política de Privacidad</li>
            <li>Tú tienes derecho a solicitar acceso, corrección o eliminación de tus datos en cualquier momento</li>
            <li>Eres responsable de mantener copias de seguridad de datos críticos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Limitaciones de garantía</h2>
          <p>Cuadra se proporciona <strong>"TAL CUAL"</strong>, sin garantías implícitas o explícitas. Específicamente, NO garantizamos:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>✗ Cumplimiento automático con leyes o regulaciones (eso es tu responsabilidad)</li>
            <li>✗ Que los datos sean aceptados o reconocidos por autoridades fiscales o administrativas</li>
            <li>✗ Disponibilidad continua 24/7 del servicio</li>
            <li>✗ Recuperación de datos en caso de pérdida o corrupción</li>
            <li>✗ Que la funcionalidad permanezca sin cambios</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Limitación de responsabilidad</h2>
          <p><strong>Cuadra no será responsable por:</strong></p>
          <ul className="list-disc list-inside space-y-2">
            <li>Pérdida de datos o dinero resultante del uso de la aplicación</li>
            <li>Multas, sanciones o problemas legales derivados de incumplimiento fiscal</li>
            <li>Decisiones comerciales tomadas basadas en reportes de Cuadra</li>
            <li>Interrupciones de servicio o errores técnicos</li>
            <li>Daños indirectos, incidentales o consecuentes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Independencia del usuario</h2>
          <p>Al usar Cuadra, reconoces que:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Eres un usuario independiente responsable de tu negocio</li>
            <li>Cuadra es una herramienta de apoyo, no un asesor legal o fiscal</li>
            <li>Debes consultar con contadores, abogados o asesores expertos según sea necesario</li>
            <li>Las decisiones operacionales y legales de tu negocio son completamente tuyas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Cambios en el disclaimer</h2>
          <p>
            Cuadra se reserva el derecho de actualizar este disclaimer en cualquier momento. Los cambios entran en vigor cuando se publican.
            Es tu responsabilidad revisar este documento periódicamente.
          </p>
        </section>

        <section className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-2xl font-bold mb-4">Contacto y dudas</h2>
          <ul className="space-y-2">
            <li><strong>Obligaciones fiscales o legales:</strong> Consulta con un contador público certificado o abogado local</li>
            <li><strong>Funcionamiento de Cuadra:</strong> Contáctanos en <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">soporte@cuadra.app</code></li>
            <li><strong>Privacidad y datos:</strong> Ver nuestra Política de Privacidad</li>
          </ul>
        </section>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-8">
          <strong>Última actualización:</strong> 29 de abril de 2026
        </p>
      </div>
    </article>
  );
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio - Cuadra',
  description: 'Términos de servicio de Cuadra',
};

export default function TermsPage() {
  return (
    <article className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">📋 Términos de Servicio</h1>

      <div className="prose prose-invert max-w-none dark:prose-invert space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Aceptación de términos</h2>
          <p>
            Al acceder y usar Cuadra, aceptas estar vinculado por estos Términos de Servicio. Si no estás de acuerdo, no uses la aplicación.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Licencia de uso</h2>
          <p>
            Cuadra te otorga una licencia <strong>revocable, no exclusiva, no transferible</strong> para usar la aplicación con fines empresariales legales.
          </p>
          <p className="font-semibold">Se prohíbe:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Reproducir, distribuir o modificar Cuadra sin autorización</li>
            <li>Intentar acceder a sistemas o datos no autorizados</li>
            <li>Usar la app para actividades ilegales</li>
            <li>Compartir credenciales o acceso con personas no autorizadas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Cuenta de usuario</h2>

          <h3 className="text-xl font-semibold mb-3">Registro</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Debes proporcionar información precisa y actualizada</li>
            <li>Eres responsable de mantener la confidencialidad de tu contraseña</li>
            <li>Eres responsable de toda actividad en tu cuenta</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Rol y permisos</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Tu rol (Owner, Staff, Admin) determina qué puedes hacer</li>
            <li>El propietario de la cuenta es responsable de los permisos asignados a otros usuarios</li>
            <li>Cuadra puede suspender cuentas que violen estos términos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Datos y privacidad</h2>

          <h3 className="text-xl font-semibold mb-3">Almacenamiento</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Tus datos se almacenan en Google Cloud/Firebase (servidores en EE.UU.)</li>
            <li>Implementamos medidas de seguridad razonables, pero no garantizamos seguridad absoluta</li>
            <li>Eres responsable de mantener copias de seguridad críticas</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Derechos sobre datos</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Eres dueño de tus datos</strong> — Cuadra no los usa para otros propósitos sin autorización</li>
            <li>Tienes derecho a solicitar acceso, corrección o eliminación</li>
            <li>Lee nuestra Política de Privacidad para más detalles</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Cumplimiento PDVD</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Cuadra cumple con la Ley de Protección de Datos Personales de Venezuela (2012)</li>
            <li>Si almacenas datos personales de clientes, eres responsable de obtener consentimiento</li>
            <li>Debes informar a clientes sobre el almacenamiento en la nube</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Limitaciones de responsabilidad</h2>
          <p>
            <strong>Cuadra se proporciona "TAL CUAL" sin garantías.</strong>
          </p>
          <p>No somos responsables por:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Pérdida de datos o dinero</li>
            <li>Interrupciones de servicio</li>
            <li>Errores o inexactitudes en reportes</li>
            <li>Incumplimiento fiscal o legal de tu parte</li>
            <li>Daños indirectos o consecuentes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Suspensión de cuenta</h2>
          <p>Podemos suspender tu cuenta si:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Violas estos términos</li>
            <li>Realizas actividades ilegales</li>
            <li>No pagas suscripciones adeudadas</li>
            <li>Detectamos uso fraudulento o abusivo</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Cambios en el servicio</h2>
          <p>Cuadra se reserva el derecho de:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Modificar funcionalidades (con aviso previo cuando sea posible)</li>
            <li>Cambiar precios</li>
            <li>Actualizar estos términos</li>
            <li>Descontinuar servicios</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Ley aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de Venezuela. Cualquier disputa se resolverá en los tribunales competentes de Venezuela.
          </p>
        </section>

        <section className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-2xl font-bold mb-4">9. Contacto</h2>
          <p>
            Para preguntas sobre estos términos: <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">soporte@cuadra.app</code>
          </p>
        </section>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-8">
          <strong>Última actualización:</strong> 29 de abril de 2026
        </p>
      </div>
    </article>
  );
}

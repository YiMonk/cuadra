import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Cuadra',
  description: 'Política de privacidad de Cuadra',
};

export default function PrivacyPage() {
  return (
    <article className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">🔒 Política de Privacidad</h1>

      <div className="prose prose-invert max-w-none dark:prose-invert space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Introducción</h2>
          <p>
            Cuadra respeta tu privacidad. Esta política explica qué datos recolectamos, cómo los usamos y tus derechos.
          </p>
          <p className="font-semibold">
            <strong>Cumplimiento:</strong> Cuadra cumple con la Ley de Protección de Datos Personales de Venezuela (2012).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Datos que recolectamos</h2>

          <h3 className="text-xl font-semibold mb-3">Datos de cuenta</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Nombre, email, teléfono</li>
            <li>Contraseña (encriptada)</li>
            <li>Rol y permisos</li>
            <li>Fecha de registro</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Datos operacionales</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Productos y precios</li>
            <li>Clientes y contacto</li>
            <li>Ventas y transacciones</li>
            <li>Inventario y movimientos</li>
            <li>Reportes y análisis</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Datos técnicos</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Dirección IP</li>
            <li>Tipo de navegador</li>
            <li>Ubicación aproximada</li>
            <li>Logs de acceso</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Cómo usamos los datos</h2>
          <p><strong>Cuadra usa tus datos para:</strong></p>
          <ul className="list-disc list-inside space-y-2">
            <li>✅ Proporcionar el servicio (gestión de inventario, reportes, etc.)</li>
            <li>✅ Mejorar la aplicación (análisis de uso agregado)</li>
            <li>✅ Seguridad (detectar fraude, proteger cuentas)</li>
            <li>✅ Cumplimiento legal (si lo requieren autoridades)</li>
            <li>✅ Comunicaciones de servicio (actualizaciones, avisos)</li>
          </ul>

          <p className="mt-4 font-semibold">Cuadra NO:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>❌ Vende datos a terceros</li>
            <li>❌ Usa datos para publicidad dirigida</li>
            <li>❌ Comparte con terceros sin tu consentimiento</li>
            <li>❌ Usa datos fuera del propósito de gestión empresarial</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Almacenamiento de datos</h2>

          <h3 className="text-xl font-semibold mb-3">Ubicación</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Servidores: Google Cloud (EE.UU.)</li>
            <li>Encriptación: en tránsito (HTTPS) y en reposo (Google Cloud encryption)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Retención</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Datos activos: mientras uses Cuadra</li>
            <li>Datos eliminados: se borran en 30 días</li>
            <li>Backups: se retienen según políticas de Google Cloud</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Tu responsabilidad</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Si almacenas datos personales de clientes, <strong>debes obtener consentimiento</strong></li>
            <li>Debes informar a tus clientes que sus datos se almacenan en la nube</li>
            <li>Eres responsable de cumplir PDVD respecto a tus clientes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Derechos de acceso y control</h2>
          <p>Tienes derecho a:</p>

          <h3 className="text-lg font-semibold mb-2 mt-4">Acceso</h3>
          <p>Solicitar copia de tus datos: soporte@cuadra.app</p>

          <h3 className="text-lg font-semibold mb-2 mt-4">Corrección</h3>
          <p>Actualizar información incorrecta directamente en la app</p>

          <h3 className="text-lg font-semibold mb-2 mt-4">Eliminación</h3>
          <p>Solicitar borrado de tu cuenta y datos asociados. Los datos se eliminarán en 30 días (excepto copias de seguridad legales)</p>

          <h3 className="text-lg font-semibold mb-2 mt-4">Portabilidad</h3>
          <p>Solicitar tus datos en formato transferible (CSV, JSON)</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Compartir datos</h2>

          <h3 className="text-xl font-semibold mb-3">No compartimos datos con:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Terceros para marketing o publicidad</li>
            <li>Competidores o negocios similares</li>
            <li>Redes sociales</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Compartimos datos solo si:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Autoridades legales:</strong> Si una corte o SENIAT lo exige (notificándote cuando sea posible)</li>
            <li><strong>Proveedores:</strong> Google Cloud (almacenamiento) bajo contrato de privacidad</li>
            <li><strong>Tu consentimiento:</strong> Explícito para propósitos específicos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Seguridad</h2>

          <h3 className="text-xl font-semibold mb-3">Medidas implementadas:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Encriptación HTTPS</li>
            <li>Autenticación Firebase (contraseñas hasheadas)</li>
            <li>Acceso basado en roles (no acceso indiscriminado a datos)</li>
            <li>Logs de auditoría</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">No garantizamos:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Seguridad 100% contra todas las amenazas</li>
            <li>Recuperación de datos eliminados</li>
            <li>Protección contra mal uso de credenciales compartidas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Cambios en esta política</h2>
          <p>
            Cuadra puede actualizar esta política en cualquier tiempo. Los cambios entran en vigor cuando se publican.
            Es tu responsabilidad revisar periódicamente.
          </p>
        </section>

        <section className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-2xl font-bold mb-4">9. Contacto</h2>
          <p>
            Para preguntas de privacidad: <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">privacidad@cuadra.app</code>
          </p>
        </section>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-8">
          <strong>Última actualización:</strong> 29 de abril de 2026
        </p>
      </div>
    </article>
  );
}

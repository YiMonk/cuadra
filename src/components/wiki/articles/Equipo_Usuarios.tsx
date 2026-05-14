import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Equipo_UsuariosArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El módulo de Equipo te permite agregar a las personas que trabajan en tu negocio
        como usuarios de Cuadra: cajeros, vendedores, administradores. Cada usuario tiene
        sus propias credenciales y permisos según su rol.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Invitar a un Nuevo Usuario
      </h2>

      <Step number={1} title="Ve a Equipo">
        En el menú lateral, haz clic en <strong>Equipo</strong> o ve a{' '}
        <strong>Configuración → Usuarios</strong>.
      </Step>

      <Step number={2} title="Haz clic en 'Invitar Usuario'">
        Busca el botón <strong>"+ Invitar"</strong> o <strong>"Agregar Miembro"</strong>.
      </Step>

      <Step number={3} title="Completa los datos del nuevo usuario">
        Ingresa:
        <List
          items={[
            'Nombre completo del usuario',
            'Correo electrónico (será su usuario de acceso)',
            'Rol que tendrá en el sistema',
          ]}
        />
      </Step>

      <Step number={4} title="Envía la invitación">
        Haz clic en <strong>"Enviar Invitación"</strong>. El usuario recibirá un correo
        con un enlace para crear su contraseña y acceder a Cuadra.
      </Step>

      <Tip>
        <strong>Roles disponibles:</strong> Al invitar un usuario, asígnale el rol mínimo
        necesario para su función. Un cajero no necesita ver reportes financieros ni
        acceso a configuración del negocio.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Roles de Usuario
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra tiene varios roles predefinidos:
      </p>

      <List
        items={[
          'Propietario (Owner): acceso completo a todo, incluyendo configuración y facturación',
          'Administrador: acceso a todo excepto configuración de plan/pago',
          'Staff / Cajero: puede hacer ventas, ver clientes y básicos del inventario',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Consulta la sección de <strong>Permisos</strong> para ver exactamente qué puede
        hacer cada rol.
      </p>

      <Warning>
        <strong>Solo una cuenta por persona:</strong> Cada miembro del equipo debe tener
        su propio usuario. No compartas credenciales entre empleados, ya que no podrás
        rastrear quién hizo qué en el historial de actividad.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Gestionar Usuarios Existentes
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Desde la lista de usuarios puedes:
      </p>

      <List
        items={[
          'Ver todos los miembros activos del equipo',
          'Cambiar el rol de un usuario',
          'Desactivar un usuario que ya no trabaja contigo (sin borrar su historial)',
          'Reenviar la invitación si el usuario no la recibió',
        ]}
      />

      <InfoBox>
        <strong>Usuarios por sucursal:</strong> Si tienes múltiples sucursales, puedes
        configurar qué sucursal(es) puede ver cada usuario. Un cajero de la sucursal
        norte no necesita acceso a los datos de la sucursal sur.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Cuántos usuarios puedo tener?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Depende del plan contratado. Revisa tu plan actual en Configuración → Suscripción
        para ver el límite de usuarios incluidos.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Qué pasa con las ventas de un usuario desactivado?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Las ventas y actividad registrada por ese usuario se mantienen en el historial.
        Desactivar un usuario no borra sus registros, solo le impide iniciar sesión.
      </p>
    </>
  );
}

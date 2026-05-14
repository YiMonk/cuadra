import React from 'react';
import { Step, Tip, InfoBox, List, Kbd } from '@/components/wiki/WikiArticleRenderer';

export default function NavegacionArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Aprende a moverte por Cuadra y accede a todos los módulos y funciones que necesitas.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Interfaz Principal
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra tiene una interfaz intuitiva diseñada para ser fácil de usar en computadora y
        móvil. Aquí está lo que necesitas saber:
      </p>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        En Computadora (Desktop)
      </h3>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        La interfaz de escritorio tiene:
      </p>

      <List
        items={[
          'Barra lateral izquierda con todos los módulos principales',
          'Área central con el contenido del módulo activo',
          'Barra superior con tu perfil, notificaciones y opciones',
          'Indicadores de tema (modo oscuro/claro)',
        ]}
      />

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white my-4">
        En Celular (Mobile)
      </h3>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En dispositivos móviles, Cuadra se adapta para ser más cómodo:
      </p>

      <List
        items={[
          'Barra inferior con acceso rápido a módulos principales',
          'Menú desplegable para acceder a más opciones',
          'Botón de menú flotante en la pantalla',
          'Interfaz optimizada para pantallas pequeñas',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Módulos Principales
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Dependiendo de tu rol, verás diferentes módulos. Los principales son:
      </p>

      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">🛒 Ventas (POS)</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Aquí registras todas tus transacciones de venta. Acceso rápido con el icono de
            carrito.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">📦 Inventario</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Gestiona tus productos, stock, y transferencias entre ubicaciones.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">👥 Clientes</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Administra información de clientes y controla sus créditos y deudas.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">💰 Cierre de Caja</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Abre y cierra sesiones de caja, realiza arqueos, y registra movimientos.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">📊 Reportes</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Visualiza análisis detallados de ventas, ganancias, inventario y más.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">⚙️ Configuración</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Ajusta tus preferencias, tema, información del negocio, y más.
          </p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Atajos de Teclado
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Usa estos atajos para navegar más rápido:
      </p>

      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/30">
          <span className="text-slate-700 dark:text-slate-300">Abrir búsqueda de Wiki</span>
          <Kbd>Ctrl K</Kbd>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/30">
          <span className="text-slate-700 dark:text-slate-300">Ir a Inicio</span>
          <Kbd>Ctrl Home</Kbd>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Buscador Global
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Necesitas ayuda rápida o quieres aprender sobre una función específica?
      </p>

      <Step number={1} title="Abre el buscador">
        Presiona <Kbd>Ctrl K</Kbd> en tu teclado (o Cmd K en Mac) desde cualquier parte de
        Cuadra.
      </Step>

      <Step number={2} title="Escribe lo que buscas">
        Comienza a escribir y verás resultados de la wiki que coincidan con tu búsqueda.
      </Step>

      <Step number={3} title="Selecciona un resultado">
        Usa las flechas del teclado (↑↓) para navegar y presiona Enter para abrir el artículo.
      </Step>

      <Tip>
        <strong>Búsqueda inteligente:</strong> El buscador busca por título, descripción, y
        etiquetas. Puedes buscar "crear venta", "stock bajo", "cómo pagar" y encontrarás
        artículos relevantes.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Tema Claro / Oscuro
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra soporta tema claro y oscuro. Para cambiar:
      </p>

      <Step number={1} title="En computadora">
        Haz clic en el icono de Sol/Luna en la barra lateral izquierda.
      </Step>

      <Step number={2} title="En celular">
        Abre el menú (⋮) y busca la opción de tema. También puedes cambiar el tema en
        Configuración.
      </Step>

      <InfoBox>
        <strong>Consejo:</strong> Cuadra recordará tu preferencia de tema la próxima vez que
        inicies sesión.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Perfil y Configuración
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Para acceder a tu perfil y configuración:
      </p>

      <Step number={1} title="En computadora">
        Haz clic en tu avatar (foto de perfil) en la esquina superior derecha.
      </Step>

      <Step number={2} title="En celular">
        Abre el menú desde el ícono de tres líneas (⋮) en la barra superior.
      </Step>

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Desde allí puedes ver tu perfil, cambiar contraseña, y ajustar otras configuraciones.
      </p>
    </>
  );
}

import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function IntroduccionArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Cuadra es una plataforma integral de gestión de negocios diseñada para ayudarte a
        administrar ventas, inventario, clientes y mucho más desde un único lugar.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        ¿Qué es Cuadra?
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra es una solución de software cloud que facilita la gestión completa de tu negocio:
      </p>

      <List
        items={[
          'Punto de Venta (POS) para registrar ventas rápidamente',
          'Gestión de inventario en tiempo real',
          'Administración de clientes y control de deudas',
          'Caja y sesiones de efectivo',
          'Reportes detallados de tu negocio',
          'Múltiples sucursales y ubicaciones',
          'Gestión de equipo y permisos',
          'Análisis y métricas de rendimiento',
        ]}
      />

      <Tip>
        <strong>Cuadra está diseñado para pequeños y medianos negocios</strong> como tiendas,
        supermercados, farmacias, restaurantes y más. Si tu negocio necesita vender y controlar
        inventario, Cuadra es para ti.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Características Principales
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💳 Punto de Venta</h3>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Crea ventas en segundos con múltiples métodos de pago
          </p>
        </div>

        <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-2">📦 Inventario</h3>
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            Controla tu stock en tiempo real y recibe alertas
          </p>
        </div>

        <div className="p-4 rounded-lg bg-pink-50/50 dark:bg-pink-900/20 border border-pink-200/50 dark:border-pink-800/50">
          <h3 className="font-semibold text-pink-900 dark:text-pink-200 mb-2">👥 Clientes</h3>
          <p className="text-sm text-pink-800 dark:text-pink-300">
            Gestiona información de clientes y controla créditos
          </p>
        </div>

        <div className="p-4 rounded-lg bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">💰 Reportes</h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Analiza tus ventas, ganancias y tendencias
          </p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        ¿Quién puede usar Cuadra?
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra es perfecto para:
      </p>

      <List
        items={[
          'Propietarios de tiendas y comercios',
          'Gerentes de inventario',
          'Emprendedores y negocios pequeños',
          'Vendedores y personal de caja',
          'Administradores de empresas',
          'Cualquiera que necesite gestionar ventas e inventario',
        ]}
      />

      <InfoBox>
        <strong>¿Preocupado por la complejidad?</strong> No te preocupes. Cuadra está diseñado
        para ser intuitivo y fácil de usar, incluso si no tienes experiencia técnica.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Próximos Pasos
      </h2>

      <Step number={1} title="Crear tu Cuenta">
        Si aún no tienes una cuenta, ve a la página de registro y crea una. Solo necesitas un
        correo electrónico y una contraseña.
      </Step>

      <Step number={2} title="Configurar tu Información">
        Completa los datos de tu negocio, incluyendo nombre, ciudad, moneda y otros detalles
        importantes.
      </Step>

      <Step number={3} title="Agregar Productos">
        Comienza agregando los productos o servicios que vendes. Puedes hacerlo uno por uno o
        importar un lote.
      </Step>

      <Step number={4} title="Hacer tu Primera Venta">
        Accede al módulo de Punto de Venta (POS) y crea tu primera transacción. Es más fácil de
        lo que parece.
      </Step>

      <p className="text-slate-700 dark:text-slate-300 mt-6">
        ¡Bienvenido a Cuadra! Estamos emocionados de ayudarte a crecer tu negocio. 🎉
      </p>
    </>
  );
}

# Proposal: finanzas-modulos

## Resumen

Implementar un sistema de dos módulos para la app: **Operativo** (la app actual — ventas, inventario, caja) y **Administrativo** (nuevo — finanzas del negocio). Al iniciar sesión el `owner` elige con cuál módulo trabajar. Desde el nav siempre puede cambiar de módulo. Las sesiones previas se guardan en localStorage para agilizar el reingreso.

## Motivación

El owner necesita un espacio separado para gestionar las finanzas del negocio (flujo de caja, ingresos, gastos, tasa BCV) sin mezclar esas vistas con el flujo operativo diario de ventas. Separar los módulos también permite luego controlar qué roles acceden a qué módulo.

## Alcance

### Incluido

- Pantalla de selección de módulo post-login (página completa)
- Botón de módulo activo en el nav (desktop sidebar + mobile bottom bar) que abre modal de cambio
- Módulo Administrativo con 7 rutas bajo `/finanzas/`: dashboard, flujo-de-caja, cuentas, gastos, ingresos, gastos-fijos, tasa-bcv — todas en estado "En construcción" inicialmente
- Módulo Operativo = app actual sin cambios funcionales
- Sesiones guardadas en localStorage (email + displayName precargado en login)
- Acceso al módulo Administrativo restringido a `owner` por ahora

### Excluido

- Contenido real de las páginas del módulo Administrativo (se llenan en cambios posteriores)
- Gestión de permisos por rol para el módulo Administrativo (change futuro)
- Cambios al backend (todo es frontend)

## Impacto Estimado

- Backend: ninguno
- Frontend: AppLayout, login page, nuevas rutas `/finanzas/*`, nuevo contexto de módulo activo
- Base de datos: ninguna migración
- Tests: flujos de selección de módulo y redirección por rol

## Riesgos

- **Ruptura de navegación existente**: el cambio en AppLayout puede afectar el nav actual — mitigación: feature-flag por rol (`owner` only) en primera iteración
- **localStorage stale**: si el usuario cambia contraseña, el email guardado puede confundir — mitigación: solo guardar email + displayName, nunca tokens

## Plan de Rollback

Revertir el componente `ModuleSelectorPage`, eliminar las rutas `/finanzas/*` y restaurar el redirect post-login al comportamiento anterior (`/pos`).

## Criterios de Aceptación (resumen)

Ver `specs/` para el detalle en Given/When/Then.

- [ ] Un owner ve la pantalla de selección de módulo después de iniciar sesión
- [ ] El botón de módulo activo es visible en el nav y abre el modal de cambio
- [ ] Las 7 rutas del módulo Administrativo renderizan "En construcción"
- [ ] Los demás roles (cashier, seller, etc.) no ven el selector ni las rutas admin
- [ ] El email del último usuario se precarga en el formulario de login

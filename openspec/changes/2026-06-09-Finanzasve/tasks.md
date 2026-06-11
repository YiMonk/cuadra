# Tasks: finanzas-modulos

## Orden de implementación

---

### Fase 1 — Infraestructura de módulos (base, sin UI)

- [x] Crear hook `useActiveModule()` en `Frontend/src/hooks/` — lee/escribe `cuadra_last_module` en localStorage (`'operativo' | 'administrativo'`)
- [x] Crear helper `useSavedSessions()` en `Frontend/src/hooks/` — lee/escribe `cuadra_saved_sessions` en localStorage (array de `{ email, displayName, lastUsed }`, max 3 entradas)
- [x] Crear estructura de rutas del módulo Administrativo: `Frontend/src/app/finanzas/` con `layout.tsx` vacío y subcarpetas para cada página

---

### Fase 2 — Guard de acceso y layout del módulo Administrativo

- [x] Implementar `Frontend/src/app/finanzas/layout.tsx`: guard por `role === 'owner'` (redirect a `/pos` si no), nav lateral desktop con 7 ítems, bottom nav mobile, botón de módulo activo
- [x] Crear 7 páginas "En construcción" bajo `/finanzas/`:
  - `dashboard/page.tsx`
  - `flujo-de-caja/page.tsx`
  - `cuentas/page.tsx`
  - `gastos/page.tsx`
  - `ingresos/page.tsx`
  - `gastos-fijos/page.tsx`
  - `tasa-bcv/page.tsx`
- [x] Cada página muestra: ícono + título + badge "Próximamente" + botón "Volver al dashboard" (excepto el propio dashboard)

---

### Fase 3 — Pantalla de selección de módulo post-login

- [x] Crear `Frontend/src/app/module-select/page.tsx` — pantalla completa con dos cards (Operativo / Administrativo), badge "Último usado" si aplica
- [x] Al seleccionar: guardar en `cuadra_last_module` y redirigir (`/pos` o `/finanzas/dashboard`)
- [x] Modificar redirect post-login en `Frontend/src/app/auth/login/page.tsx`: si `role === 'owner'` → `/module-select`, si no → `/pos`

---

### Fase 4 — Botón de módulo activo + modal de cambio (AppLayout)

- [x] Añadir botón de módulo activo en `AppLayout.tsx` (solo para `owner`): desktop en sidebar, mobile en bottom nav
- [x] Crear componente `ModuleSwitcherModal` — dos cards, módulo activo destacado, cierra con Escape o clic fuera
- [x] Al cambiar módulo: actualizar `useActiveModule()` y navegar a la ruta principal del módulo elegido

---

### Fase 5 — Sesiones guardadas en login

- [x] Modificar `Frontend/src/app/auth/login/page.tsx`: al login exitoso guardar en `cuadra_saved_sessions`
- [x] Renderizar sección "Acceso rápido" con cards de sesiones guardadas (max 3, más reciente primero)
- [x] Al clic en card: precargar email en input y mover foco a contraseña
- [x] Botón (×) en cada card para eliminar esa sesión guardada

---

### Fase 6 — QA y ajustes

- [x] TypeScript check sin errores (`npx tsc --noEmit`) — PASS
- [ ] Verificar que roles non-owner no ven botón de módulo ni acceden a `/finanzas/*`
- [ ] Verificar que la pantalla de selección no aparece para roles non-owner
- [ ] Verificar reingreso con `cuadra_last_module` previamente guardado
- [ ] Probar en mobile (sin backdrop-filter/blur en overlays durante scroll)

---

### Fase 7 — Documentación

- [ ] Actualizar `Context.md` en BrainTwo con la arquitectura de módulos
- [ ] Actualizar specs si hubo cambios durante implementación

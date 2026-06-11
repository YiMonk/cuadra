# Spec: Módulo Administrativo

## Descripción

Conjunto de rutas bajo `/finanzas/` accesibles exclusivamente para el rol `owner`. En esta primera iteración todas las páginas renderizan un estado "En construcción" con su título e ícono. El contenido real de cada página se desarrolla en changes posteriores.

---

## Rutas del módulo

| Ruta                      | Página                     | Ícono sugerido |
| ---------------------------| ----------------------------| ----------------|
| `/finanzas/dashboard`     | Dashboard financiero       | BarChart2      |
| `/finanzas/flujo-de-caja` | Flujo de caja              | ArrowLeftRight |
| `/finanzas/cuentas`       | Cuentas bancarias / cajas  | Landmark       |
| `/finanzas/gastos`        | Gastos                     | TrendingDown   |
| `/finanzas/ingresos`      | Ingresos                   | TrendingUp     |
| `/finanzas/gastos-fijos`  | Gastos fijos / recurrentes | RepeatIcon     |
| `/finanzas/tasa-bcv`      | Tasa BCV                   | DollarSign     |

---

## Criterios de Aceptación

### Escenario: Owner navega al módulo Finanzas

**Given** el owner seleccionó el Módulo Finanzas  
**When** se carga `/finanzas/dashboard`  
**Then** ve el layout del módulo con nav lateral (desktop) o bottom nav (mobile)  
**And** los ítems de nav corresponden a las 7 secciones administrativas  
**And** el botón de módulo activo muestra "Finanzas"  

---

### Escenario: Owner accede a cualquier página del módulo Administrativo

**Given** el owner está en el módulo Administrativo  
**When** navega a cualquiera de las 7 rutas  
**Then** ve la página con su título, ícono y el mensaje "En construcción"  
**And** el ítem activo en el nav queda destacado  

---

### Escenario: Owner intenta acceder a `/finanzas/*` desde el módulo Operativo

**Given** el owner está en el módulo Operativo  
**When** escribe manualmente `/finanzas/gastos` en la URL  
**Then** la app redirige a `/finanzas/dashboard` (respetando que tiene acceso)  
**And** el módulo activo cambia a "Administrativo"  

---

### Escenario: Rol no autorizado intenta acceder a `/finanzas/*`

**Given** un usuario con rol `cashier`, `seller`, `manager` o `supervisor`  
**When** intenta navegar a cualquier ruta bajo `/finanzas/`  
**Then** es redirigido a `/pos`  
**And** no ve el nav del módulo Administrativo  

---

### Escenario: Página "En construcción"

**Given** cualquier página del módulo Administrativo en esta iteración  
**When** la ruta carga  
**Then** muestra: ícono de la sección + título de la página + badge "Próximamente" + mensaje motivacional  
**And** un botón "Volver al dashboard" si no es el dashboard  

---

## Notas Técnicas

- El layout del módulo Administrativo puede reusar `AppLayout` con una prop `module="finanzas"` que cambia los ítems del nav, o puede tener su propio layout en `src/app/finanzas/layout.tsx`
- Preferir un `layout.tsx` propio en `/finanzas/` para mantener el nav operativo intacto y no contaminar `AppLayout` con condicionales de módulo
- El guard de acceso por rol va en el `layout.tsx` de `/finanzas/` usando `useAuth()` — si el rol no es `owner`, redirect a `/pos`
- Las páginas "En construcción" son componentes mínimos — no necesitan llamadas al backend

# Spec UI: Selector de Módulo

---

## 1. Pantalla completa de selección (post-login)

### Propósito
Permitir al owner elegir con qué módulo trabajar cada vez que inicia sesión, de forma clara y sin fricción.

### Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│   [Logo Cuadra]                             │
│   Hola, {nombre} 👋                         │
│   ¿Qué vas a gestionar hoy?                 │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │                 │  │                 │   │
│  │  [🛒 ícono]     │  │  [📊 ícono]     │   │
│  │                 │  │                 │   │
│  │  OPERATIVO      │  │  ADMINISTRATIVO │   │
│  │                 │  │                 │   │
│  │  Ventas, caja,  │  │  Finanzas,      │   │
│  │  inventario,    │  │  flujo de caja, │   │
│  │  clientes       │  │  cuentas        │   │
│  │                 │  │                 │   │
│  │  [Último usado] │  │                 │   │
│  └─────────────────┘  └─────────────────┘   │
│                                             │
│         [Cerrar sesión]                     │
│                                             │
└─────────────────────────────────────────────┘
```

Mobile: las dos cards apiladas verticalmente (full width).

### Comportamiento

**Given** el owner llega a esta pantalla  
**When** la pantalla carga  
**Then** ambas cards son visibles y clickeables  
**And** si hay `cuadra_last_module` en localStorage, esa card muestra el badge "Último usado"

**When** el owner hace clic en una card  
**Then** hay feedback visual inmediato (scale + opacity)  
**And** se navega al módulo elegido sin delay perceptible

### Estados especiales
- **Sin módulo previo**: ambas cards iguales, sin badge
- **Con módulo previo**: la card del módulo anterior tiene badge "Último usado" + borde sutil destacado

---

## 2. Botón de módulo activo en el Nav

### Desktop (sidebar)

```
┌──────────────────────┐
│  [Logo]              │
│                      │
│  ─────────────────   │
│  ┌────────────────┐  │
│  │ ⚡ OPERATIVO ▾ │  │  ← botón siempre visible
│  └────────────────┘  │
│  ─────────────────   │
│                      │
│  [items de nav...]   │
│                      │
└──────────────────────┘
```

### Mobile (bottom nav)

El botón del módulo activo reemplaza o se agrega como el primer ítem de la barra inferior, con ícono de grid/módulos y el nombre del módulo actual.

### Comportamiento del botón

**When** el usuario hace clic en el botón del módulo activo  
**Then** aparece un modal centrado con las dos opciones de módulo

---

## 3. Modal de cambio de módulo

### Layout

```
┌─────────────────────────────┐
│  Cambiar módulo         [X] │
│                             │
│  ┌─────────┐  ┌──────────┐  │
│  │         │  │          │  │
│  │ ⚡ OPER. │  │ 📊 ADMIN │  │
│  │         │  │          │  │
│  │ [activo]│  │          │  │
│  └─────────┘  └──────────┘  │
│                             │
│         [Cancelar]          │
└─────────────────────────────┘
```

### Comportamiento

**When** el modal abre  
**Then** el módulo activo tiene borde o fondo destacado (accent-primary)  
**And** el otro módulo es seleccionable

**When** el usuario selecciona el módulo activo  
**Then** el modal se cierra sin cambiar nada

**When** el usuario selecciona el otro módulo  
**Then** el modal se cierra y la app navega al módulo elegido

---

## 4. Sesiones guardadas en login

### Layout (debajo del botón "Iniciar Sesión")

```
┌─────────────────────────────────────────┐
│  Acceso rápido                          │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ [Avatar/inicial] Juan Pérez      │   │
│  │                  juan@mail.com   │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ [Avatar/inicial] María García    │   │
│  │                  maria@mail.com  │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Comportamiento

**When** el usuario hace clic en una card de sesión guardada  
**Then** el campo de email del formulario se rellena automáticamente  
**And** el cursor se mueve al campo de contraseña  
**And** la card queda destacada visualmente

**When** el usuario termina de iniciar sesión  
**Then** esa sesión se mueve al primer lugar de la lista (más reciente)

---

## Principios UX

- Las cards de módulo deben ser grandes y táctiles — fáciles de tocar en mobile
- Feedback inmediato en cada clic (scale, transición suave)
- El modal de cambio de módulo debe poder cerrarse con Escape o clic fuera
- Las sesiones guardadas son opcionales — si el usuario no quiere usarlas, puede ignorarlas y escribir normalmente
- Nunca mostrar contraseñas guardadas ni sugerirlas — solo el email

## Accesibilidad

- Las cards de módulo tienen `role="button"` y `aria-label`
- El modal tiene `role="dialog"` y foco atrapado mientras está abierto
- El botón de módulo en nav tiene `aria-label="Módulo activo: {nombre}, clic para cambiar"`

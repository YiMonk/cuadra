# Spec: Selector de Módulo

## Descripción

Sistema que permite al `owner` elegir entre el Módulo Operativo y el Módulo Administrativo al iniciar sesión, y cambiar de módulo en cualquier momento desde el nav sin tener que cerrar sesión.

---

## Criterios de Aceptación

### Escenario: Owner inicia sesión por primera vez (sin preferencia guardada)

**Given** un usuario con rol `owner` acaba de autenticarse correctamente  
**When** el sistema resuelve el redirect post-login  
**Then** se muestra la pantalla completa de selección de módulo  
**And** no se redirige a `/pos` directamente  

---

### Escenario: Owner inicia sesión con módulo preferido guardado

**Given** un `owner` que ya eligió un módulo en una sesión anterior (guardado en localStorage como `cuadra_last_module`)  
**When** completa el login  
**Then** se muestra igualmente la pantalla de selección  
**And** el módulo usado anteriormente aparece visualmente destacado como "último usado"  
**And** puede confirmar ese módulo con un clic o elegir el otro  

---

### Escenario: Owner selecciona Módulo Operativo

**Given** el owner está en la pantalla de selección de módulo  
**When** hace clic en "Operativo"  
**Then** se guarda `cuadra_last_module = 'operativo'` en localStorage  
**And** se redirige a `/pos`  

---

### Escenario: Owner selecciona Módulo Administrativo

**Given** el owner está en la pantalla de selección de módulo  
**When** hace clic en "Administrativo"  
**Then** se guarda `cuadra_last_module = 'finanzas'` en localStorage  
**And** se redirige a `/finanzas/dashboard`  

---

### Escenario: Cambio de módulo desde el nav (modal)

**Given** el owner está dentro de cualquier módulo  
**When** hace clic en el botón del módulo activo en el nav  
**Then** aparece un modal con las dos opciones de módulo  
**And** el módulo activo aparece marcado/destacado  
**When** selecciona el otro módulo  
**Then** se actualiza `cuadra_last_module` en localStorage  
**And** se redirige a la ruta principal del módulo elegido  
**And** el modal se cierra  

---

### Escenario: Usuario con rol distinto a owner intenta acceder a `/finanzas/*`

**Given** un usuario con rol `cashier`, `seller`, `manager` o `supervisor`  
**When** intenta navegar a cualquier ruta bajo `/finanzas/`  
**Then** es redirigido a `/pos`  
**And** no ve el botón de módulo en el nav (o ve solo "Operativo" sin opción de cambio)  

---

### Escenario: Sesiones guardadas en login

**Given** un usuario inició sesión previamente en este dispositivo  
**When** vuelve a la página de login  
**Then** aparece una card debajo del botón de login con el email y nombre del último usuario  
**And** al hacer clic en esa card se precarga el email en el formulario  
**And** el usuario solo necesita ingresar la contraseña  

---

### Escenario: Sesión guardada con múltiples usuarios

**Given** dos usuarios han iniciado sesión en el mismo dispositivo  
**When** se abre la página de login  
**Then** se muestran hasta 3 cards de sesiones anteriores (más reciente primero)  
**And** cada card muestra: avatar/inicial, nombre y email  

---

## Notas Técnicas

- El módulo activo se guarda en `localStorage` bajo la key `cuadra_last_module` (`'operativo' | 'administrativo'`)
- Las sesiones guardadas se almacenan en `localStorage` bajo `cuadra_saved_sessions` como array de `{ email, displayName, lastUsed: timestamp }`
- Nunca guardar tokens, contraseñas ni datos sensibles en localStorage
- El contexto de módulo activo puede ser un simple hook `useActiveModule()` que lee/escribe localStorage — no necesita context global ni estado en backend
- La redirección post-login actual en `AuthContext` o en las páginas de login debe condicionarse al rol: si es `owner` → selector de módulo, si no → `/pos` (comportamiento actual)

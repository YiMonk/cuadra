---
name: opsx-propose
description: >-
  Ejecuta el flujo completo de OpenSpec /opsx:propose de forma guiada.
  Activar cuando el usuario diga frases como: "hagamos un cambio", "quiero proponer
  un cambio", "nueva feature", "vamos a implementar X", "crea un change para",
  "/opsx:propose", "/opsx:new", o cualquier señal de querer iniciar un cambio
  estructurado en el proyecto. Guía al usuario con preguntas paso a paso para
  rellenar todos los artefactos de OpenSpec: proposal, specs (Given/When/Then),
  tasks y diseño UX si aplica.
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Skill: opsx-propose — Flujo Guiado de OpenSpec

Cuando este skill se activa, NO empieces a escribir artefactos de inmediato.
Primero guía al usuario con preguntas concretas para entender el cambio.
Solo genera los archivos cuando tengas suficiente información.

---

## Paso 0 — Detectar contexto del proyecto

Antes de preguntar nada, haz esto silenciosamente:

1. Busca `openspec/project.md` para entender el proyecto
2. Busca `openspec/config.yaml` para el schema activo
3. Lista `openspec/changes/` para ver changes existentes y evitar duplicados
4. Lee `CLAUDE.md` si existe para contexto adicional

Si no existe carpeta `openspec/`, avisa:

> "No encontré una carpeta `openspec/` en este proyecto. ¿Quieres que la inicialice
> primero con `openspec init`? (necesitas tener instalado `@fission-ai/openspec`)"

---

## Paso 1 — Entrevista guiada

Haz las preguntas **de a una o dos por mensaje**, no todas juntas.
Adapta las preguntas según lo que ya sabes del contexto del proyecto.

### Bloque A — Identidad del cambio

Pregunta esto primero:

> **¿Cómo llamamos a este cambio?** (ej: `add-dark-mode`, `user-profile-edit`, `payment-flow`)
> Y en una oración: ¿qué problema resuelve o qué valor agrega?

### Bloque B — Alcance (luego de tener nombre y descripción)

> **¿Qué áreas toca este cambio?** Marca las que aplican:
>
> - [ ] Backend (API, servicios, base de datos)
> - [ ] Frontend (vistas, componentes, estado)
> - [ ] Ambos
> - [ ] Solo infraestructura / config
>
> **¿Hay componentes o módulos específicos que ya sabes que se van a modificar?**

### Bloque C — Comportamiento esperado

> Descríbeme el flujo desde la perspectiva del usuario:
>
> - ¿Qué puede hacer el usuario que HOY no puede hacer?
> - ¿Cuál es el "caso feliz" principal?
> - ¿Hay casos de error o edge cases importantes que ya veas?

### Bloque D — Criterios de éxito

> ¿Cómo vamos a saber que este cambio está "done"?
> (ej: el usuario puede X, el test Y pasa, el endpoint Z retorna...)

### Bloque E — Restricciones (solo si aplica)

> ¿Hay algo que este cambio NO debe hacer o límites a respetar?
> (performance, compatibilidad, seguridad, scope freeze, etc.)

### Bloque F — UX (solo si hay frontend involucrado)

> Para la parte visual, ¿tienes alguna referencia, wireframe o idea de cómo
> debería verse? Aunque sea en texto:
>
> - ¿Dónde vive esta vista dentro de la app?
> - ¿Qué elementos principales necesita mostrar?
> - ¿Hay estados especiales? (vacío, cargando, error, éxito)

---

## Paso 2 — Confirmar antes de generar

Una vez que tengas respuestas de todos los bloques relevantes, resume así:

```
Perfecto. Voy a crear el change **[nombre]** con los siguientes artefactos:

📋 proposal.md      — descripción, motivación, alcance, rollback
📐 specs/           — criterios Given/When/Then por escenario
  ├── [módulo/feature].md
  └── ui/[vista].md  (si hay frontend)
✅ tasks.md         — lista de tareas ordenadas por dependencia

¿Arrancamos?
```

Espera confirmación antes de escribir archivos.

---

## Paso 3 — Generar artefactos

Crea la estructura en `openspec/changes/<nombre-del-change>/`.

### `proposal.md`

```markdown
# Proposal: <nombre-del-change>

## Resumen

<descripción en 2-3 líneas>

## Motivación

<problema que resuelve, por qué ahora>

## Alcance

### Incluido

- <qué sí entra>

### Excluido

- <qué no entra — importante para evitar scope creep>

## Impacto Estimado

- Backend: <módulos/servicios afectados>
- Frontend: <vistas/componentes afectados>
- Base de datos: <migraciones necesarias o ninguna>
- Tests: <qué tipo de tests se necesitan>

## Riesgos

- <riesgo 1>: <mitigación>

## Plan de Rollback

<cómo deshacemos este cambio si algo sale mal>

## Criterios de Aceptación (resumen)

Ver specs/ para el detalle completo en Given/When/Then.

- [ ] <criterio 1>
- [ ] <criterio 2>
```

### `specs/<feature>.md` — por cada área funcional

```markdown
# Spec: <nombre de la feature o módulo>

## Descripción

<qué hace este componente>

## Criterios de Aceptación

### Escenario: <caso feliz>

**Given** <estado inicial>
**When** <acción>
**Then** <resultado observable>
**And** <resultado adicional si aplica>

### Escenario: <caso de error>

**Given** <estado inicial>
**When** <acción inválida o fallo>
**Then** <el sistema responde con X>

### Escenario: <caso borde>

**Given** <condición límite>
**When** <acción>
**Then** <comportamiento esperado>

## Notas Técnicas

<dependencias, patrones a seguir, referencias a código existente>
```

### `specs/ui/<vista>.md` — solo si hay frontend

````markdown
# Spec UI: <nombre de la vista>

## Propósito

<qué necesita lograr el usuario aquí>

## Layout

\```
┌─────────────────────────────────┐
│ [elementos del layout] │
└─────────────────────────────────┘
\```

## Comportamiento

### Escenario: Carga inicial

**Given** el usuario navega a esta ruta
**When** la página carga
**Then** <qué ve>

### Escenario: Interacción principal

**Given** el usuario está en la vista
**When** <acción>
**Then** <feedback visual>

### Escenario: Estado vacío

**Given** no hay datos
**When** la vista carga
**Then** <empty state con mensaje y CTA>

### Escenario: Estado de error

**Given** el API falla
**When** se intenta cargar
**Then** <error state con opción de retry>

## Principios UX

- Feedback inmediato en acciones async (loading state)
- Siempre hay un camino de regreso (error recovery)
- <otros principios relevantes para este caso>

## Accesibilidad

- <aria-labels necesarios>
- <navegación por teclado>
- <contraste>
````

### `tasks.md`

```markdown
# Tasks: <nombre-del-change>

## Orden de implementación

(de menor a mayor dependencia)

### Fase 1 — Base de datos / modelos

- [ ] <tarea concreta>
- [ ] <tarea concreta>

### Fase 2 — Backend / API

- [ ] <tarea concreta>
- [ ] <tarea concreta>

### Fase 3 — Frontend

- [ ] <tarea concreta>
- [ ] <tarea concreta>

### Fase 4 — Tests

- [ ] Unit: <qué>
- [ ] Integration: <qué>
- [ ] E2E: <flujo completo>

### Fase 5 — Documentación

- [ ] Actualizar Context.md en BrainTwo
- [ ] Actualizar specs si hubo cambios durante implementación
```

---

## Paso 4 — Sincronizar Progress.md en Obsidian

**Siempre** después de crear, avanzar o archivar un change, actualiza el archivo:
la carpeta:
`/home/yimonk/Documentos/BrainTwo/Projects/<Proyecto>/Progress/`

### Estructura de la subcarpeta Progress/

```
Projects/
└── <Proyecto>/
    ├── Context.md
    ├── Architecture.md
    ├── Specs/
    └── Progress/
        ├── Overview.md          ← kanban general + log de actividad
        └── <nombre-change>.md   ← una nota por change con su historial completo
```

### Cómo detectar el nombre del proyecto

Usa en orden de prioridad:

1. `openspec/project.md` → campo `name`
2. Nombre de la carpeta raíz del repo
3. `package.json` → campo `name`

### Qué escribir según el evento

**Al crear un change** (`/opsx:propose`):

- Agregar entrada en la sección `## 🔵 Propuesto` con fecha de hoy
- Formato: `- [ ] [[Specs/<feature>|<nombre-change>]] — <descripción corta> · 📅 <fecha>`

**Al avanzar un change** (`/opsx:apply` o progreso parcial):

- Mover la entrada de `🔵 Propuesto` → `🟡 En Progreso`
- Agregar nota de progreso con fecha: `  - <fecha>: <qué se hizo>`

**Al archivar un change** (`/opsx:archive`):

- Mover la entrada a `✅ Completado`
- Registrar fecha de cierre

**Al bloquear un change** (detectar dependencia no resuelta o decisión pendiente):

- Mover a `🔴 Bloqueado` con nota de por qué

### `Progress/Overview.md` — kanban central

```markdown
---
type: progress
project: "<Nombre del Proyecto>"
status: active
tags: [project/<nombre>, progress]
updated: <YYYY-MM-DD>
---

# Progress: <Nombre del Proyecto>

Part of [[Context]]. · [[Progress/Overview|← Overview]]

## Resumen

| Estado         | Cantidad |
| -------------- | -------- |
| 🔵 Propuesto   | N        |
| 🟡 En Progreso | N        |
| 🔴 Bloqueado   | N        |
| ✅ Completado  | N        |

---

## 🟡 En Progreso

- [ ] [[Specs/<feature>|<nombre-change>]] — <descripción corta> · 📅 iniciado <fecha>
  - <fecha>: <nota de progreso>
  - <fecha>: <nota de progreso>

---

## 🔵 Propuesto

- [ ] [[Specs/<feature>|<nombre-change>]] — <descripción corta> · 📅 <fecha>

---

## 🔴 Bloqueado

- [ ] [[Specs/<feature>|<nombre-change>]] — <descripción corta> · ⛔ <razón del bloqueo>

---

## ✅ Completado

- [x] [[Specs/<feature>|<nombre-change>]] — <descripción corta> · ✅ <fecha de cierre>

---

## 📋 Log de Actividad

| Fecha   | Change   | Evento      | Notas               |
| ------- | -------- | ----------- | ------------------- |
| <fecha> | <nombre> | Propuesto   | <descripción corta> |
| <fecha> | <nombre> | En progreso | <qué se empezó>     |
| <fecha> | <nombre> | Completado  | <qué se logró>      |
```

### Si `Progress/` no existe aún

Crea la carpeta y ambos archivos desde cero. En `Overview.md` incluye en `## ✅ Completado` cualquier change que ya esté en `openspec/changes/` marcado como archivado, y crea una nota `<nombre>.md` por cada uno de ellos.

---

## Paso 5 — Cerrar el flujo

Luego de generar todos los archivos y actualizar Obsidian, reporta:

```
✅ Change **[nombre]** creado en openspec/changes/[nombre]/

Artefactos generados:
  📋 proposal.md
  📐 specs/[feature].md
  📐 specs/ui/[vista].md   (si aplica)
  ✅ tasks.md

📓 Obsidian actualizado:
  BrainTwo/Projects/[Proyecto]/Progress/Overview.md  → agregado en 🔵 Propuesto
  BrainTwo/Projects/[Proyecto]/Progress/[nombre].md  → nota del change creada

Próximos pasos:
  → Revisa los artefactos y ajusta lo que no esté bien
  → Cuando estés listo para implementar: /opsx:apply  (mueve a 🟡 En Progreso)
  → Al terminar: /opsx:archive                        (mueve a ✅ Completado)
```

---

## Reglas de comportamiento

- **Una pregunta a la vez** cuando el usuario no ha dado suficiente contexto
- **No inventar detalles** — si no se dijo, marcar como `[TBD]` en el artefacto
- **Adaptar el nivel de detalle** al alcance del cambio (un bugfix no necesita spec UI)
- **Reusar patrones existentes** — leer el código base antes de proponer estructura nueva
- **Confirmar siempre antes de escribir archivos**
- **Progress.md siempre se actualiza** — es parte del trabajo, no opcional
- **El log de actividad nunca se borra** — solo se agregan entradas, es el historial permanente

---

## Template: `Progress/<nombre-change>.md`

Una nota por change. Se crea cuando se propone y se enriquece a lo largo del ciclo de vida.

```markdown
---
type: progress-change
project: "<Nombre del Proyecto>"
change: "<nombre-change>"
status: proposed # proposed | in-progress | blocked | done
tags: [project/<nombre>, progress/change]
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
---

# Change: <nombre-change>

Part of [[Progress/Overview]]. · Spec: [[Specs/<feature>]]

## Descripción

<descripción corta del change>

## Estado actual

`proposed` → `in-progress` → `done` _(tachar los anteriores con ~~texto~~)_

## Historial

### <YYYY-MM-DD> — Propuesto

- Alcance: <resumen>
- Artefactos creados: proposal.md, specs/, tasks.md

### <YYYY-MM-DD> — En progreso

- <qué se implementó o avanzó>
- Tareas completadas: <lista>
- Pendiente: <lista>

### <YYYY-MM-DD> — Completado

- <qué se logró>
- Tests: <resultado>
- Notas para el futuro: <aprendizajes>

## Links

- [[Specs/<feature>]] — spec funcional
- [[Specs/ui/<vista>]] — spec de UI (si aplica)
- [[Context]] — estado general del proyecto
```

---
name: opsx-apply
description: >-
  Inicia la implementación de un change de OpenSpec. Activar cuando el usuario
  diga frases como: "implementemos", "arrancamos con", "vamos a codear",
  "empecemos el change", "apliquemos", "/opsx:apply", o cualquier señal de
  querer pasar de planificación a ejecución de un change existente.
  Mueve el change a En Progreso en Obsidian y guía la implementación por fases.
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Skill: opsx-apply — Implementar un Change

Cuando este skill se activa, primero identifica qué change se va a implementar,
luego actualiza Obsidian y finalmente guía la ejecución por fases.

---

## Paso 0 — Identificar el change

Lee silenciosamente:

1. Lista `openspec/changes/` y muestra los changes disponibles con su estado
2. Si el usuario ya mencionó el nombre, úsalo directamente
3. Si no, pregunta:

> **¿Qué change vamos a implementar?**
> Changes disponibles:
>
> - `<nombre>` — <descripción del proposal.md>
> - `<nombre>` — <descripción del proposal.md>

Una vez confirmado, lee completo:

- `openspec/changes/<nombre>/proposal.md`
- `openspec/changes/<nombre>/specs/`
- `openspec/changes/<nombre>/tasks.md`

---

## Paso 1 — Actualizar Obsidian: mover a En Progreso

Actualiza `/home/yimonk/Documentos/BrainTwo/Projects/<Proyecto>/Progress/Overview.md`:

1. Busca la entrada del change en `## 🔵 Propuesto`
2. Muévela a `## 🟡 En Progreso`
3. Agrega la fecha de inicio debajo
4. Actualiza la tabla de resumen (Propuesto -1, En Progreso +1)
5. Agrega fila al log de actividad

```markdown
## 🟡 En Progreso

- [ ] [[Progress/<nombre>|<nombre>]] — <descripción corta> · 📅 iniciado <fecha>
  - <fecha>: Implementación iniciada
```

Actualiza `/home/yimonk/Documentos/BrainTwo/Projects/<Proyecto>/Progress/<nombre>.md`:

```markdown
### <YYYY-MM-DD> — En progreso

- Implementación iniciada
- Fase actual: <Fase 1 / la primera del tasks.md>
- Pendiente: <resto de fases>
```

---

## Paso 2 — Presentar el plan de implementación

Antes de escribir código, muestra el plan extraído del `tasks.md`:

```
📋 Change: <nombre>
📐 Specs cargadas: <lista de archivos en specs/>

Plan de implementación:
  Fase 1 — <nombre> · <N tareas>
  Fase 2 — <nombre> · <N tareas>
  ...

¿Arrancamos por la Fase 1?
```

---

## Paso 3 — Implementar por fases

Trabaja **una fase a la vez**. Por cada fase:

1. Lee los specs relevantes para esa fase
2. Implementa siguiendo los criterios Given/When/Then de las specs
3. Al terminar cada tarea, márcala como completada en `tasks.md`:
   - `- [x] <tarea>` en lugar de `- [ ] <tarea>`
4. Al terminar la fase completa, reporta:

```
✅ Fase <N> completada
  - <tarea hecha>
  - <tarea hecha>

¿Continuamos con Fase <N+1>: <nombre>?
```

---

## Paso 4 — Actualizar progreso parcial en Obsidian

Después de cada fase completada, actualiza `Progress/<nombre>.md`:

```markdown
### <YYYY-MM-DD> — Fase <N> completada

- <qué se implementó>
- Tareas: <N completadas / N total>
- Tests: <resultado si se corrieron>
- Pendiente: <fases restantes>
```

Y en `Overview.md`, agrega nota de progreso bajo la entrada del change:

```markdown
- <fecha>: Fase <N> completada — <descripción breve>
```

---

## Paso 5 — Al terminar todas las fases

Cuando todas las tareas del `tasks.md` estén marcadas como `[x]`, reporta:

```
🎉 Todas las fases completadas para **<nombre>**

¿Corremos los tests finales antes de archivar?
  → Si sí: los ejecuto y reporto resultados
  → Si no: podemos pasar directo a /opsx:archive
```

Si se corren tests, registra resultados en:
`/home/yimonk/Documentos/BrainTwo/Projects/<Proyecto>/Testing/Results.md`

---

## Reglas de comportamiento

- **Respetar las specs**: implementar exactamente lo que dice el Given/When/Then, no más
- **Una fase a la vez**: no saltar fases sin confirmación
- **Actualizar tasks.md en tiempo real**: marcar tareas completadas a medida que se hacen
- **Si hay bloqueante**: mover el change a 🔴 Bloqueado en Obsidian y documentar el motivo
- **No cerrar el change**: eso lo hace `/opsx:archive` — este skill solo implementa

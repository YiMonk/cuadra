---
name: opsx-archive
description: >-
  Cierra y archiva un change completado de OpenSpec. Activar cuando el usuario
  diga frases como: "cerremos esto", "ya terminamos", "archivemos el change",
  "esto está done", "marquemos como completado", "/opsx:archive", o cualquier
  señal de que un change está terminado y listo para cerrar.
  Actualiza Obsidian, sincroniza specs al spec principal y deja todo limpio.
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Skill: opsx-archive — Cerrar y Archivar un Change

Cuando este skill se activa, hace el cierre completo: verifica que esté listo,
actualiza Obsidian, sincroniza specs y deja el proyecto en estado limpio.

---

## Paso 0 — Identificar el change a archivar

Lee silenciosamente `openspec/changes/` y filtra los que tienen todas las tareas
en `tasks.md` marcadas como `[x]`.

Si el usuario ya mencionó el nombre, úsalo. Si no, pregunta:

> **¿Qué change vamos a archivar?**
> Changes listos para cerrar:
> - `<nombre>` — <descripción corta>
>
> Changes con tareas pendientes (no recomendado archivar aún):
> - `<nombre>` — faltan N tareas

---

## Paso 1 — Verificación de cierre

Antes de archivar, verifica:

```
Verificando change: <nombre>

✅ proposal.md existe
✅ specs/ completas
⚠️  tasks.md: <N> de <N> tareas completadas   ← si hay pendientes, avisar
✅ Tests: <resultado o "no registrado">
```

Si hay tareas sin completar, pregunta:
> Hay <N> tareas sin marcar como completas. ¿Archivamos igual o las revisamos primero?

---

## Paso 2 — Nota de cierre del change

Pide al usuario una nota de cierre rápida:

> Para el registro: ¿Hay algo que valga la pena anotar sobre este change?
> (aprendizajes, decisiones de último momento, deuda técnica generada, etc.)
> Si no, escribe "nada" y archivamos.

---

## Paso 3 — Actualizar Obsidian

### `Progress/<nombre>.md`

Agrega la sección final de cierre:

```markdown
### <YYYY-MM-DD> — ✅ Completado

- Todas las tareas implementadas
- <nota de cierre del usuario o "Sin notas adicionales">
- Tests finales: <resultado>
- Deuda técnica generada: <si hay, o "ninguna">

---
*Change cerrado. Ver [[Context]] para estado actualizado del proyecto.*
```

Actualiza el frontmatter:
```yaml
status: done
updated: <YYYY-MM-DD>
```

### `Progress/Overview.md`

1. Busca la entrada en `## 🟡 En Progreso` (o `## 🔵 Propuesto` si nunca se movió)
2. Muévela a `## ✅ Completado`
3. Cambia `- [ ]` por `- [x]`
4. Agrega fecha de cierre
5. Actualiza tabla de resumen
6. Agrega fila al log de actividad

```markdown
## ✅ Completado

- [x] [[Progress/<nombre>|<nombre>]] — <descripción corta> · ✅ cerrado <fecha>
```

Log:
```markdown
| <fecha> | <nombre> | Completado | <nota de cierre breve> |
```

### `Context.md`

Actualiza la tabla de estado si el change afectaba un módulo:

```markdown
## Lo que se hizo en esta sesión
- ✅ Change `<nombre>` completado: <qué se logró>
```

Y en `## Próximos Pasos`, elimina o tacha cualquier referencia a este change.

---

## Paso 4 — Sincronizar specs al spec principal (opsx:sync)

Si existe `openspec/specs/` (spec principal del proyecto), mergea los delta specs
del change al spec principal:

1. Lee `openspec/changes/<nombre>/specs/*.md`
2. Busca si ya existe una sección correspondiente en `openspec/specs/`
3. Si existe: actualiza/mergea el contenido
4. Si no existe: agrega la nueva sección

Informa qué se mergeó:
```
📐 Specs sincronizadas al spec principal:
  - <feature>.md → openspec/specs/<sección>
  - ui/<vista>.md → openspec/specs/ui/<sección>
```

Si no existe `openspec/specs/`, omite este paso y anótalo como deuda:
> "No encontré `openspec/specs/`. Considera inicializar el spec principal del proyecto."

---

## Paso 5 — Reporte de cierre

```
✅ Change **<nombre>** archivado

Resumen:
  📋 Tareas completadas: <N>/<N>
  🧪 Tests: <resultado>
  📅 Duración: <fecha inicio> → <fecha cierre>

Obsidian actualizado:
  Progress/Overview.md     → movido a ✅ Completado
  Progress/<nombre>.md     → nota de cierre registrada
  Context.md               → estado del proyecto actualizado

OpenSpec:
  specs/ sincronizadas al spec principal ✓
  (o nota si no aplica)

Próximo paso sugerido:
  → ¿Hay otro change listo para implementar? /opsx:apply
  → ¿Nuevo cambio que planificar? /opsx:propose
```

---

## Reglas de comportamiento

- **Nunca archivar sin confirmación** del usuario, aunque todo esté `[x]`
- **La nota de cierre es importante** — aunque sea corta, es el historial permanente
- **Context.md siempre se toca** — el estado macro del proyecto debe reflejar el cierre
- **No borrar nada** — mover, no eliminar; el historial de `Progress/<nombre>.md` es permanente
- **Si hay deuda técnica** detectada durante la implementación, registrarla en `Open Questions.md` antes de cerrar
# Design: audit-log

## Schema de la tabla `audit_log`

```sql
CREATE TABLE audit_log (
    id            VARCHAR PRIMARY KEY,          -- UUID v4, generado en Python
    company_id    VARCHAR NOT NULL,             -- owner_id del usuario autenticado
    user_id       VARCHAR NOT NULL,             -- id del usuario que ejecutó la acción
    user_name     VARCHAR NOT NULL,             -- nombre snapshot (no FK, inmutable)
    action        VARCHAR NOT NULL,             -- "sale.created", "user.archived", etc.
    entity_type   VARCHAR NOT NULL,             -- "sale" | "user" | "product" | ...
    entity_id     VARCHAR NOT NULL,             -- id de la entidad afectada (como string)
    payload_before TEXT,                        -- JSON serializado del estado previo, nullable
    payload_after  TEXT,                        -- JSON serializado del estado posterior, nullable
    ip            VARCHAR,                      -- IP del cliente, nullable
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Notas de tipos:**
- `payload_before` / `payload_after` se guardan como `TEXT` (JSON serializado) en lugar de `JSONB` para compatibilidad con SQLite en dev. En producción (PostgreSQL Neon) se puede migrar a `JSONB` en un change posterior si se necesita filtrado por contenido.
- Todos los IDs son `VARCHAR` — sin FK constraints hacia otras tablas. Esto es intencional: si una entidad relacionada es borrada (físicamente, en una operación de emergencia), el audit log no debe romperse.

**Indices recomendados:**

```sql
-- Consultas más frecuentes: listar por company con orden cronológico
CREATE INDEX ix_audit_log_company_created ON audit_log (company_id, created_at DESC);

-- Filtro por usuario dentro de una compañía
CREATE INDEX ix_audit_log_company_user ON audit_log (company_id, user_id);

-- Filtro por tipo de entidad dentro de una compañía
CREATE INDEX ix_audit_log_company_entity_type ON audit_log (company_id, entity_type);
```

No se indexa `entity_id` como columna independiente; si se necesita drill-down por entidad específica, el volumen esperado en v1 es suficientemente bajo como para que el índice compuesto en `company_id` + `entity_type` sea eficiente con filtro adicional.

---

## Inmutabilidad

**Estrategia**: inmutabilidad a nivel de código, no a nivel de base de datos.

- El router de audit-log expone **solo** `GET /api/v1/audit-log`. No se registran rutas `PUT`, `PATCH` ni `DELETE`.
- `audit_service.py` expone **solo** la función `log()`. No tiene métodos `update()`, `delete()`, ni `update_log()`.
- A nivel de base de datos **no** se usan triggers ni `REVOKE` de `UPDATE/DELETE` en dev (SQLite no lo soporta y complicaría las migraciones). La política es: ningún código de la app ejecuta `UPDATE` o `DELETE` sobre esta tabla.
- Las revisiones de PR deben rechazar cualquier código que importe `AuditLog` con intent de mutación.

Opcionalmente, en producción (PostgreSQL) se puede añadir una regla de base de datos en un change posterior:
```sql
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;
```
Pero esto no es parte de v1 para no añadir complejidad al flujo de migraciones.

---

## Estrategia de captura before/after

**Momento de captura**: la serialización ocurre **dentro del service**, antes y después de la operación sobre el objeto ORM, pero antes del `commit`.

Flujo concreto en un service que usa `@audit_action`:

1. El service llama a `snapshot_before = audit_service.snapshot(entity)` antes de modificar el objeto ORM. `snapshot()` serializa el objeto a `dict` usando `sqlalchemy.inspect(entity).attrs` o un método `to_dict()` en el modelo.
2. Se aplican los cambios sobre el objeto ORM.
3. Se llama a `await db.commit()`.
4. El service llama a `snapshot_after = audit_service.snapshot(entity)` (después del refresh).
5. Se llama a `await audit_service.log(action=..., before=snapshot_before, after=snapshot_after, ...)` en un bloque `try/except` que no relanza.

**Campos a excluir del snapshot**: `password_hash`, tokens, cualquier campo marcado con `audit_exclude = True` en el modelo. La función `snapshot()` debe filtrar estos campos explícitamente.

**Por qué no decorator automático**: ver sección siguiente.

---

## Estrategia de anotación: llamada explícita en service (recomendada)

**Opción elegida**: llamada explícita dentro del service, no decorator ni middleware.

**Opciones evaluadas:**

| Opción | Pros | Contras |
|--------|------|---------|
| Middleware global | Cero boilerplate en servicios | No tiene acceso al estado antes del cambio; captura request/response HTTP pero no el estado del ORM; no sabe qué entidad cambió |
| Decorator `@audit_action` sobre endpoint | Menos boilerplate | Misma limitación que middleware; el endpoint no tiene acceso a los snapshots ORM |
| Llamada explícita en service | Control total del before/after; sabe exactamente qué cambió; granular por operación | Requiere añadir 3-4 líneas por operación auditada |

**Conclusión**: el audit log de alta fidelidad (con `payload_before` / `payload_after`) **requiere acceso al objeto ORM antes y después del commit**. Esto solo es posible desde el service. Un decorator o middleware HTTP no puede obtener esa información sin acoplarse al ORM de forma frágil.

La llamada explícita también hace el comportamiento observable y testeable: cada service test puede verificar que `audit_service.log()` fue llamado con los parámetros correctos mockeando la función.

**Interfaz del servicio:**

```python
# Backend/app/services/audit_service.py

async def log(
    db: AsyncSession,
    *,
    action: str,           # "sale.created" | "user.archived" | ...
    entity_type: str,      # "sale" | "user" | "product" | ...
    entity_id: str,
    user: User,
    request: Request,
    before: dict | None = None,
    after: dict | None = None,
) -> None:
    """Fire-and-forget: captura errores internamente, nunca relanza."""
    ...

def snapshot(entity, exclude: list[str] | None = None) -> dict:
    """Serializa un objeto ORM a dict, excluyendo campos sensibles."""
    ...
```

---

## Acciones auditadas en v1

Se auditan únicamente las acciones de mayor impacto en integridad de negocio. No se audita lectura (GET).

| Acción | `entity_type` | `action` | before | after |
|--------|---------------|----------|--------|-------|
| Crear venta | `sale` | `sale.created` | null | snapshot venta |
| Cancelar/devolver venta | `sale` | `sale.cancelled` | snapshot | snapshot |
| Crear ajuste de inventario | `stock_adjustment` | `stock.adjusted` | null | snapshot |
| Crear gasto | `expense` | `expense.created` | null | snapshot |
| Cerrar caja | `cash_closing` | `cash_closing.created` | null | snapshot |
| Archivar usuario | `user` | `user.archived` | snapshot | snapshot |
| Desarchivar usuario | `user` | `user.unarchived` | snapshot | snapshot |
| Invitar usuario al equipo | `user` | `user.invited` | null | snapshot (sin password_hash) |
| Actualizar usuario | `user` | `user.updated` | snapshot | snapshot |
| Actualizar producto (precio) | `product` | `product.updated` | snapshot | snapshot |

Las operaciones de solo lectura (GET), login y refresh de token **no** se auditan en v1.

---

## Frontend: tabla de auditoría

**Ruta**: `/auditoria` — accesible solo para role `owner`. El layout verifica el role y redirige a `/dashboard` si no es owner.

**Columnas de la tabla:**

| Columna | Campo API | Notas |
|---------|-----------|-------|
| Fecha y hora | `created_at` | Formato local, ej. "10 jun 2025 14:32" |
| Usuario | `user_name` | String snapshot |
| Acción | `action` | Label legible: "sale.created" → "Venta creada" |
| Entidad | `entity_type` + `entity_id` | Ej. "Venta #abc123" — el id truncado |
| IP | `ip` | Puede ser null, mostrar "—" |
| Detalle | expand row | Al expandir muestra diff before/after en JSON |

**Filtros disponibles (barra superior):**
- Rango de fechas: date picker con `from_date` / `to_date`
- Usuario: select con miembros del equipo (incluye archivados)
- Tipo de entidad: select con los `entity_type` válidos

**Paginación**: cursor-based con botón "Cargar más" (load more), no paginación numérica. El endpoint devuelve un campo `next_cursor` que se pasa como `before_id` en la siguiente request.

**Estado de carga**: skeleton rows mientras carga. Si la lista está vacía, mensaje "No hay registros de auditoría para los filtros seleccionados".

**No hay acciones destructivas** en esta tabla (sin botones de eliminar, editar). Es solo lectura.

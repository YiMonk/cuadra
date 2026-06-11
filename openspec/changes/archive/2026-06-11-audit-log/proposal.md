## Why

La plataforma necesita trazabilidad permanente de todas las acciones relevantes para cumplir requisitos de auditoría, depuración y confianza del dueño. El log existente (`activity`) es operacional y básico — no garantiza inmutabilidad ni registra el estado anterior/posterior de los datos. Adicionalmente, los usuarios no se deben poder eliminar físicamente, solo desactivar o archivar para preservar la integridad histórica.

## What Changes

- Se introduce la tabla `audit_log` como registro inmutable: sin endpoints DELETE ni UPDATE, solo INSERT y GET.
- Se diferencia `archived` de `active=false`: un usuario archivado no aparece en listas normales pero existe en el historial.
- El audit log captura `payload_before` y `payload_after` en operaciones de escritura relevantes (ventas, pagos, ajustes de inventario, cambios de usuario, etc.).
- Panel de auditoría en el frontend: solo visible para owner, solo lectura, con filtros por fecha/usuario/entidad.

## Capabilities

### New Capabilities
- `audit-log`: tabla inmutable con registro de acciones: `id, company_id, user_id, user_name, action, entity_type, entity_id, payload_before, payload_after, ip, created_at`. Sin DELETE endpoint. GET con filtros por fecha, user_id, entity_type.
- `user-archive`: estado `archived` en usuarios — diferente a `active=false`. Archivado = desactivado + oculto de listas normales. El dueño puede archivar y desarchivar. Nunca eliminar.

### Modified Capabilities
- `users`: añadir campo `archived bool default false`. Modificar listados para excluir archivados por defecto. Añadir endpoint `POST /team/{id}/archive` y `POST /team/{id}/unarchive`.

## Impact

**Backend:**
- Nueva tabla `audit_log` (sin FK hacia entidades para no romper si se borran datos relacionados — IDs como strings)
- Middleware o decorator `@audit` para anotar endpoints que deben registrar cambios
- Servicio `audit_service.py` con método `log(action, entity_type, entity_id, before, after, user, request)`
- Modificación de `User` model: campo `archived`
- Migración Alembic

**Frontend:**
- Sección "Auditoría" en panel admin, solo owner, tabla con filtros
- Listas de usuarios: excluir archivados por defecto, opción "mostrar archivados"
- Botón "Archivar" en lugar de "Eliminar" en gestión de equipo

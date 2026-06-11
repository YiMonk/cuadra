# Tasks: audit-log

## Backend — Modelos

- [x] Crear `Backend/app/models/audit_log.py` con el modelo `AuditLog`: campos `id` (UUID str), `company_id`, `user_id`, `user_name`, `action`, `entity_type`, `entity_id`, `payload_before` (Text nullable), `payload_after` (Text nullable), `ip` (nullable), `created_at` (TIMESTAMPTZ, server_default=now, no `onupdate`)
- [x] Añadir campo `archived: Mapped[bool]` con `default=False, nullable=False` al modelo `Backend/app/models/user.py`
- [x] Registrar `AuditLog` en `Backend/app/models/__init__.py` (o donde se importe para Alembic)

## Backend — Migración

- [x] Generar migración Alembic: `alembic revision --autogenerate -m "add audit_log table and user archived field"` y revisar el script generado en `Backend/alembic/versions/`
- [x] Verificar que la migración incluye: creación de tabla `audit_log`, tres índices (`ix_audit_log_company_created`, `ix_audit_log_company_user`, `ix_audit_log_company_entity_type`), y columna `archived` en `users`
- [x] Aplicar migración en dev con `alembic upgrade head` y confirmar que no hay errores

## Backend — Servicio de auditoría

- [x] Crear `Backend/app/services/audit_service.py` con la función `snapshot(entity, exclude=None) -> dict` que serializa un objeto ORM a dict excluyendo `password_hash` y campos en la lista `exclude`
- [x] Implementar `async def log(db, *, action, entity_type, entity_id, user, request, before=None, after=None) -> None` en `audit_service.py`: crea instancia `AuditLog`, hace `db.add()` y `await db.commit()` en un bloque `try/except` que loguea a `stderr` en nivel `WARNING` sin relanzar la excepción
- [x] Escribir tests unitarios en `Backend/tests/test_audit_service.py`: test de inserción correcta, test de que un error de DB no relanza excepción, test de que `snapshot()` excluye `password_hash`

## Backend — Router de auditoría

- [x] Crear `Backend/app/routers/audit_log.py` con un único endpoint `GET /api/v1/audit-log` protegido por `require_roles("owner")`, con query params: `from_date` (opcional, date), `to_date` (opcional, date), `user_id` (opcional, str), `entity_type` (opcional, Literal con los valores válidos), `page_size` (int, default 100, max 100), `before_id` (opcional, str para cursor)
- [x] Implementar la query en el router usando `select(AuditLog).where(company_id == ...).order_by(created_at.desc())` con los filtros opcionales encadenados, y paginación por cursor (`id < before_id` aprovechando el orden por `created_at DESC` + `id`)
- [x] Crear schema Pydantic `AuditLogEntry` en `Backend/app/schemas/audit_log.py` con todos los campos del modelo y `next_cursor: str | None`
- [x] Registrar el router en `Backend/app/main.py` junto a los otros routers existentes
- [x] Escribir tests de integración en `Backend/tests/test_audit_log_router.py`: test de acceso solo owner (admin → 403, cashier → 403), test de filtro por `entity_type`, test de filtro por `user_id`, test de filtro por rango de fechas, test de que no existen endpoints DELETE/PUT/PATCH

## Backend — Endpoints de archivado de usuarios

- [x] Añadir endpoint `POST /api/v1/users/team/{userId}/archive` en `Backend/app/routers/users.py`, protegido por `require_roles("owner")`: valida que el userId no sea el propio owner, verifica que `archived = false`, establece `archived = true` y `active = false`, llama a `audit_service.log()` con `action="user.archived"`, responde 200 con `UserProfile`
- [x] Añadir endpoint `POST /api/v1/users/team/{userId}/unarchive` en `Backend/app/routers/users.py`, protegido por `require_roles("owner")`: verifica que `archived = true`, establece `archived = false` (no reactiva `active`), llama a `audit_service.log()` con `action="user.unarchived"`, responde 200 con `UserProfile`
- [x] Modificar el endpoint `GET /api/v1/users/team` en `Backend/app/routers/users.py` para añadir filtro `User.archived == False` por defecto y aceptar query param `include_archived: bool = False` que lo omite cuando es `True`
- [x] Actualizar el schema `UserProfile` en `Backend/app/schemas/users.py` para incluir el campo `archived: bool`
- [x] Escribir tests para los nuevos endpoints de archivado en `Backend/tests/test_users_router.py`: archive → 200, archive propio owner → 400, archive ya archivado → 409, unarchive → 200, admin intenta archive → 403, listar equipo sin `include_archived` excluye archivados, con `include_archived=true` los incluye

## Backend — Integración de auditoría en operaciones existentes

- [x] Añadir llamadas a `audit_service.log()` en el service/router de ventas (`Backend/app/routers/sales.py` o service equivalente) para las acciones `sale.created` y `sale.cancelled`, incluyendo snapshots before/after
- [x] Añadir llamadas a `audit_service.log()` en el router de usuarios (`Backend/app/routers/users.py`) para `user.invited` (POST /team/invite) y `user.updated` (PUT /team/{userId})
- [x] Añadir llamadas a `audit_service.log()` en el router de productos para `product.updated` (PUT /api/v1/products/{id}) cuando cambia el precio (`price` en before != after)

## Frontend — Servicio y tipos

- [x] Crear `Frontend/src/types/audit-log.ts` con las interfaces `AuditLogEntry` (todos los campos del response) y `AuditLogFilters` (`from_date`, `to_date`, `user_id`, `entity_type`, `before_id`)
- [x] Crear `Frontend/src/services/auditLogService.ts` con la función `getAuditLog(filters: AuditLogFilters): Promise<{ entries: AuditLogEntry[], next_cursor: string | null }>` usando `api.get` de `@/lib/api`

## Frontend — Componentes de la tabla de auditoría

- [x] Crear `Frontend/src/components/audit/AuditLogFilters.tsx`: barra de filtros con date pickers para `from_date`/`to_date`, select de usuario (llama a `GET /api/v1/users/team?include_archived=true`), select de `entity_type` con las opciones válidas; emite `onChange(filters)` al componente padre
- [x] Crear `Frontend/src/components/audit/AuditLogTable.tsx`: tabla con columnas Fecha, Usuario, Acción (label legible mapeado desde `action`), Entidad (`entity_type` + `entity_id` truncado), IP; fila expandible que muestra `payload_before` y `payload_after` formateados como JSON; estado vacío con mensaje; skeleton de carga
- [x] Crear `Frontend/src/components/audit/AuditLogEntryDetail.tsx`: panel de detalle que renderiza el diff before/after como bloques `<pre>` con JSON pretty-printed; usar fondo diferenciado para before (rojo suave) y after (verde suave)

## Frontend — Página de auditoría

- [x] Crear `Frontend/src/app/auditoria/page.tsx`: página protegida que verifica `user.role === "owner"` y redirige a `/dashboard` si no cumple; compone `AuditLogFilters` + `AuditLogTable`; maneja estado de filtros, lista de entries y cursor de paginación; incluye botón "Cargar más" que appenda resultados a la lista existente
- [x] Añadir enlace a "Auditoría" en la navegación del `AppLayout` (`Frontend/src/components/layout/AppLayout.tsx`), visible solo cuando `user.role === "owner"`

## Frontend — Gestión de equipo (archivado)

- [x] Modificar la página/componente de gestión de equipo para reemplazar el botón "Eliminar" por "Archivar" en usuarios activos, y añadir botón "Desarchivar" para usuarios archivados
- [x] Añadir toggle "Mostrar archivados" en la lista de equipo que llama a `GET /api/v1/users/team?include_archived=true` cuando está activo
- [x] Crear `Frontend/src/services/teamService.ts` (o actualizar el existente) con funciones `archiveUser(userId: string)` y `unarchiveUser(userId: string)` que llaman a los nuevos endpoints POST

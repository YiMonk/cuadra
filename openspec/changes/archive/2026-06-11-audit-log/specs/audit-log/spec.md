# Specs: Audit Log

## Registrar entrada de auditoría (inserción interna)

GIVEN el sistema ejecuta una operación de escritura anotada con `@audit_action`
WHEN la operación principal completa con éxito (commit)
THEN el servicio `audit_service.log()` inserta una fila en `audit_log`
AND los campos obligatorios son: `user_id`, `user_name`, `action`, `entity_type`, `entity_id`, `created_at`
AND `payload_before` y `payload_after` se serializan a JSON desde el estado del objeto ORM antes y después del commit
AND `company_id` se toma del `owner_id` del usuario autenticado
AND `ip` se extrae de `request.client.host`; si no está disponible se guarda `null`
AND el `id` se genera como UUID v4

GIVEN la inserción en `audit_log` falla (error de DB, timeout)
WHEN la operación principal ya fue commiteada
THEN el error en audit log se captura y se loguea en stderr
AND la respuesta HTTP al cliente NO se ve afectada (fire-and-forget post-commit)
AND se emite un log de nivel `WARNING` con el traceback

GIVEN la operación principal falla antes del commit
WHEN se lanza una excepción antes de llamar a `audit_service.log()`
THEN NO se inserta ningún registro en `audit_log`
AND no se registra una operación que nunca ocurrió

## Listar entradas de auditoría

GIVEN un usuario con role `owner` envía JWT válido
WHEN GET /api/v1/audit-log
THEN responde 200
AND devuelve únicamente registros donde `company_id` = `owner_id` del usuario autenticado
AND ordena por `created_at` DESC
AND devuelve máximo 100 registros por página (paginación por cursor con `before_id` o `page`/`page_size`)
AND los campos devueltos son: `id`, `user_id`, `user_name`, `action`, `entity_type`, `entity_id`, `payload_before`, `payload_after`, `ip`, `created_at`

GIVEN un usuario con role `admin`, `cashier`, `viewer` o `staff` envía JWT válido
WHEN GET /api/v1/audit-log
THEN responde 403

## Filtrar por rango de fechas

GIVEN un owner envía `from_date` (ISO 8601) y/o `to_date` (ISO 8601) como query params
WHEN GET /api/v1/audit-log?from_date=2025-01-01&to_date=2025-12-31
THEN devuelve solo registros con `created_at` dentro del rango
AND los límites son inclusivos

GIVEN el owner envía solo `from_date`
WHEN GET /api/v1/audit-log?from_date=2025-06-01
THEN devuelve registros desde esa fecha hasta hoy

GIVEN los parámetros de fecha tienen formato inválido
WHEN GET /api/v1/audit-log?from_date=not-a-date
THEN responde 422

## Filtrar por usuario

GIVEN un owner envía `user_id` como query param
WHEN GET /api/v1/audit-log?user_id={userId}
THEN devuelve solo registros donde `user_id` = userId
AND el userId debe pertenecer al mismo `company_id`; si no, devuelve lista vacía

## Filtrar por tipo de entidad

GIVEN un owner envía `entity_type` como query param
WHEN GET /api/v1/audit-log?entity_type=sale
THEN devuelve solo registros donde `entity_type` = "sale"
AND los valores válidos son: `sale`, `user`, `product`, `stock_adjustment`, `expense`, `cash_closing`, `payment`
AND si se envía un `entity_type` no reconocido, responde 422

## Filtrar combinado

GIVEN un owner envía múltiples filtros simultáneos
WHEN GET /api/v1/audit-log?from_date=2025-01-01&user_id=abc&entity_type=sale
THEN aplica todos los filtros con AND lógico
AND responde 200 con los resultados que cumplen todos los criterios

## Inmutabilidad — sin endpoint DELETE

GIVEN cualquier cliente intenta eliminar una entrada del audit log
WHEN DELETE /api/v1/audit-log/{id}
THEN responde 405 Method Not Allowed
AND NO existe tal endpoint en el router

## Inmutabilidad — sin endpoint UPDATE

GIVEN cualquier cliente intenta modificar una entrada del audit log
WHEN PUT /api/v1/audit-log/{id} o PATCH /api/v1/audit-log/{id}
THEN responde 405 Method Not Allowed
AND NO existe tal endpoint en el router

## Inmutabilidad — a nivel de servicio

GIVEN el código interno del backend intenta llamar a un método de update/delete sobre `AuditLog`
WHEN `audit_service` expone solo el método `log()` (insert) y ningún método de mutación
THEN no existe función `update_log()` ni `delete_log()` en `audit_service.py`
AND las revisiones de código deben rechazar cualquier PR que añada mutaciones a esta tabla

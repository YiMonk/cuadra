# Specs: Log de Actividad

## Registrar acción
GIVEN el sistema procesa cualquier acción significativa (crear venta, ajustar stock, etc.)
WHEN internamente se llama al servicio de activity
THEN crea un registro en activities con: owner_id, user_id, user_name, action, entity_type, entity_id, metadata
AND created_at = now()
AND esta operación NO puede fallar la operación principal (fire and forget)

## Listar actividades globales
GIVEN un owner o admin envía JWT válido
WHEN GET /api/v1/activity
THEN devuelve actividades del mismo owner_id
AND ordena por created_at DESC
AND acepta ?limit= (default 100, max 500)
AND responde 200

GIVEN un cashier intenta listar actividades
WHEN GET /api/v1/activity
THEN responde 403

## Listar actividades de un usuario
GIVEN un owner o admin envía JWT válido y userId
WHEN GET /api/v1/activity?user_id={userId}
THEN filtra actividades donde user_id = userId
AND responde 200

GIVEN el userId no pertenece al mismo owner_id
WHEN GET /api/v1/activity?user_id={userId}
THEN devuelve lista vacía (no expone errores de seguridad)

# Specs: User Archive

## Archivar usuario (owner)

GIVEN un usuario con role `owner` envía JWT válido
WHEN POST /api/v1/users/team/{userId}/archive
THEN busca el usuario donde `id` = userId AND `owner_id` = owner_id del autenticado
AND si no existe, responde 404
AND si existe, establece `archived = true` y `active = false`
AND responde 200 con el perfil actualizado del usuario
AND el sistema inserta una entrada en `audit_log` con `action = "user.archived"`, `entity_type = "user"`, `entity_id = userId`

GIVEN el userId ya tiene `archived = true`
WHEN POST /api/v1/users/team/{userId}/archive
THEN responde 409 con detalle "usuario ya archivado"

GIVEN el owner intenta archivarse a sí mismo
WHEN POST /api/v1/users/team/{ownerId}/archive
THEN responde 400 con detalle "no puedes archivarte a ti mismo"

GIVEN un usuario con role `admin` o inferior envía JWT válido
WHEN POST /api/v1/users/team/{userId}/archive
THEN responde 403

GIVEN el userId pertenece a un `owner_id` diferente
WHEN POST /api/v1/users/team/{userId}/archive
THEN responde 404 (no se expone que el usuario existe en otro tenant)

## Desarchivar usuario (owner)

GIVEN un usuario con role `owner` envía JWT válido
WHEN POST /api/v1/users/team/{userId}/unarchive
THEN busca el usuario donde `id` = userId AND `owner_id` = owner_id del autenticado AND `archived = true`
AND si no existe o no está archivado, responde 404
AND si existe, establece `archived = false` (mantiene `active = false` para que el owner decida reactivarlo explícitamente)
AND responde 200 con el perfil actualizado del usuario
AND el sistema inserta una entrada en `audit_log` con `action = "user.unarchived"`, `entity_type = "user"`, `entity_id = userId`

GIVEN un usuario con role `admin` o inferior envía JWT válido
WHEN POST /api/v1/users/team/{userId}/unarchive
THEN responde 403

## Listar equipo — excluir archivados por defecto

GIVEN un owner o admin envía JWT válido sin parámetros adicionales
WHEN GET /api/v1/users/team
THEN devuelve usuarios donde `owner_id` coincide AND `archived = false`
AND los usuarios archivados NO aparecen en la respuesta por defecto
AND el resultado incluye tanto usuarios activos como inactivos (active true/false) que no estén archivados

## Listar equipo — incluir archivados opcionalmente

GIVEN un owner o admin envía JWT válido con query param `include_archived=true`
WHEN GET /api/v1/users/team?include_archived=true
THEN devuelve todos los usuarios del mismo `owner_id`, incluyendo archivados
AND los usuarios archivados incluyen el campo `archived: true` en la respuesta

GIVEN un usuario con role `cashier`, `viewer` o `staff` envía `include_archived=true`
WHEN GET /api/v1/users/team?include_archived=true
THEN responde 403 (este endpoint ya requiere owner o admin)

## Nunca eliminar usuario físicamente

GIVEN cualquier cliente intenta eliminar físicamente un usuario del equipo
WHEN DELETE /api/v1/users/team/{userId}
THEN el endpoint solo puede marcar `active = false` (comportamiento actual)
AND NO existe ninguna ruta que ejecute `db.delete(user)` o `DELETE FROM users`
AND si el intent es "eliminar definitivamente", el sistema responde con instrucción de archivar en su lugar

GIVEN un admin intenta desactivar a otro admin
WHEN DELETE /api/v1/users/team/{userId} (desactivar)
THEN responde 403 (solo owner puede desactivar admins)

## Campo `archived` en respuesta del perfil

GIVEN cualquier endpoint que devuelva `UserProfile`
WHEN el response schema incluye el campo `archived`
THEN `archived` es `bool`, default `false`
AND los endpoints existentes que devuelven `UserProfile` incluyen este campo sin breaking change

## Usuarios archivados y autenticación

GIVEN un usuario con `archived = true` y `active = false` intenta hacer login
WHEN POST /api/v1/auth/login
THEN responde 401 (porque `active = false` ya bloquea el acceso en `get_current_user`)
AND el mensaje de error NO revela el estado de archivado

GIVEN un usuario tiene `archived = true`
WHEN `get_current_user` en `deps.py` evalúa el JWT
THEN el usuario es rechazado por `active = false` antes de evaluar `archived`
AND no requiere cambios en `deps.py`

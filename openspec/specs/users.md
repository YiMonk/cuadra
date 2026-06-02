# Specs: Usuarios y Equipo

## Ver perfil propio
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/users/me
THEN responde 200
AND devuelve id, email, nombre, role, owner_id, created_at, active
AND NO devuelve password_hash

## Editar perfil propio
GIVEN el usuario envía JWT válido y campos a actualizar (nombre, phone, avatar_url)
WHEN PUT /api/v1/users/me
THEN actualiza SOLO los campos enviados
AND responde 200 con los datos actualizados
AND NO permite cambiar email ni role por esta ruta

GIVEN el usuario envía nombre vacío
WHEN PUT /api/v1/users/me
THEN responde 422

## Cambiar contraseña
GIVEN el usuario envía current_password correcto + new_password >= 8 chars
WHEN POST /api/v1/users/me/change-password
THEN actualiza el password_hash
AND responde 200

GIVEN el usuario envía current_password incorrecto
WHEN POST /api/v1/users/me/change-password
THEN responde 401

## Desactivar cuenta propia
GIVEN el usuario (owner) envía JWT válido
WHEN DELETE /api/v1/users/me
THEN marca active=false (soft delete)
AND responde 204
AND ese usuario ya no puede hacer login

## Listar equipo (miembros de la misma cuenta)
GIVEN un usuario con role owner o admin envía JWT válido
WHEN GET /api/v1/users/team
THEN responde 200
AND devuelve todos los usuarios con el mismo owner_id
AND NO devuelve password_hash de ninguno

GIVEN un usuario con role cashier envía JWT válido
WHEN GET /api/v1/users/team
THEN responde 403

## Invitar miembro al equipo
GIVEN un owner envía email, nombre y role (cashier | admin | viewer)
WHEN POST /api/v1/users/team/invite
THEN crea el usuario con active=true
AND el password puede ser temporal (enviado por email) o aleatorio
AND owner_id del nuevo usuario = owner_id del owner que invita
AND responde 201 con los datos del nuevo usuario

GIVEN el email ya existe
WHEN POST /api/v1/users/team/invite
THEN responde 409

GIVEN un cashier intenta invitar
WHEN POST /api/v1/users/team/invite
THEN responde 403

## Actualizar miembro del equipo
GIVEN un owner o admin envía JWT válido y datos del miembro
WHEN PUT /api/v1/users/team/{userId}
THEN actualiza nombre, role, commission_pct, default_location_id
AND NO puede cambiar el role a "owner"
AND responde 200

GIVEN el userId no pertenece al mismo owner_id
WHEN PUT /api/v1/users/team/{userId}
THEN responde 404

## Desactivar miembro del equipo
GIVEN un owner envía JWT válido
WHEN DELETE /api/v1/users/team/{userId}
THEN marca active=false en ese usuario
AND responde 204

GIVEN un admin intenta desactivar a otro admin
WHEN DELETE /api/v1/users/team/{userId}
THEN responde 403 (solo owner puede)

GIVEN el userId no pertenece al mismo owner_id
WHEN DELETE /api/v1/users/team/{userId}
THEN responde 404

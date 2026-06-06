# Specs: Usuarios

## Ver perfil propio
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/users/me
THEN responde 200
AND devuelve id, email, nombre, fecha de creación, estado de cuenta si esta activo o no
AND NO devuelve password_hash

## Editar perfil
GIVEN el usuario envía JWT válido y campos a actualizar
WHEN PUT /api/v1/users/me
THEN actualiza SOLO los campos enviados
AND responde 200 con los datos actualizados
AND NO permite cambiar el email por esta ruta

GIVEN el usuario envía un nombre vacío
WHEN PUT /api/v1/users/me
THEN responde 422

## Eliminar cuenta
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/users/me
THEN marca el usuario como deleted_at (soft delete)
AND responde 204
AND ese usuario ya no puede hacer login

## Cuenta Deshabilitada
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/users/me
THEN marca el usuario como inactivo (este estado varia de acuerdo a la suscripcion)
AND responde 204
AND ese usuario ya no puede hacer login cuenta inhabilitada

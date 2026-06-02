# Specs: Sucursales

## Listar sucursales
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/locations
THEN devuelve sucursales con active=true del mismo owner_id
AND responde 200

## Crear sucursal
GIVEN un owner o admin envía nombre de sucursal
WHEN POST /api/v1/locations
THEN crea la sucursal con owner_id del JWT y active=true
AND responde 201

GIVEN un cashier intenta crear sucursal
WHEN POST /api/v1/locations
THEN responde 403

GIVEN falta el campo name
WHEN POST /api/v1/locations
THEN responde 422

## Actualizar sucursal
GIVEN un owner o admin envía JWT válido y campos a actualizar
WHEN PATCH /api/v1/locations/{locationId}
THEN actualiza name, address, phone
AND responde 200

GIVEN el locationId no existe o es de otro owner
WHEN PATCH /api/v1/locations/{locationId}
THEN responde 404

## Desactivar sucursal
GIVEN un owner envía JWT válido
WHEN DELETE /api/v1/locations/{locationId}
THEN marca active=false
AND responde 204

GIVEN un admin intenta desactivar sucursal
WHEN DELETE /api/v1/locations/{locationId}
THEN responde 403 (solo owner puede)

GIVEN el locationId no existe o es de otro owner
WHEN DELETE /api/v1/locations/{locationId}
THEN responde 404

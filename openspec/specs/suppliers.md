# Specs: Proveedores

## Listar proveedores
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/suppliers
THEN devuelve proveedores con active=true del mismo owner_id
AND ordena por name ASC
AND responde 200

## Crear proveedor
GIVEN el usuario envía nombre (requerido) y datos opcionales
WHEN POST /api/v1/suppliers
THEN crea el proveedor con owner_id del JWT y active=true
AND responde 201

GIVEN falta el campo name
WHEN POST /api/v1/suppliers
THEN responde 422

## Actualizar proveedor
GIVEN el usuario envía JWT válido y campos parciales
WHEN PATCH /api/v1/suppliers/{supplierId}
THEN actualiza SOLO los campos enviados (name, contact_name, phone, email, address, notes)
AND responde 200

GIVEN el supplierId no existe o es de otro owner
WHEN PATCH /api/v1/suppliers/{supplierId}
THEN responde 404

## Eliminar proveedor (soft delete)
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/suppliers/{supplierId}
THEN marca active=false
AND responde 204

GIVEN el supplierId no existe o es de otro owner
WHEN DELETE /api/v1/suppliers/{supplierId}
THEN responde 404

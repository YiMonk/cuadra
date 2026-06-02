# Specs: Categorías

## Listar categorías
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/categories
THEN devuelve categorías del mismo owner_id
AND ordena por name ASC
AND responde 200

## Crear categoría
GIVEN el usuario envía name (requerido) y opcionales (parent_id, color, icon)
WHEN POST /api/v1/categories
THEN crea la categoría con owner_id del JWT
AND responde 201

GIVEN falta el campo name
WHEN POST /api/v1/categories
THEN responde 422

GIVEN se envía parent_id que no existe en el mismo owner
WHEN POST /api/v1/categories
THEN responde 400 con "categoría padre no encontrada"

## Actualizar categoría
GIVEN el usuario envía JWT válido y campos parciales
WHEN PATCH /api/v1/categories/{categoryId}
THEN actualiza SOLO los campos enviados
AND responde 200

GIVEN el categoryId no existe o es de otro owner
WHEN PATCH /api/v1/categories/{categoryId}
THEN responde 404

## Eliminar categoría
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/categories/{categoryId}
THEN elimina la categoría (hard delete)
AND responde 204

GIVEN la categoría tiene subcategorías activas
WHEN DELETE /api/v1/categories/{categoryId}
THEN responde 400 con "la categoría tiene subcategorías, elimínalas primero"

GIVEN el categoryId no existe o es de otro owner
WHEN DELETE /api/v1/categories/{categoryId}
THEN responde 404

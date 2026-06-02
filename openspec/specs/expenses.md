# Specs: Gastos

## Listar gastos
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/expenses
THEN devuelve gastos del mismo owner_id
AND ordena por paid_at DESC
AND acepta ?start_date= y ?end_date= para filtrar por rango
AND responde 200

## Crear gasto
GIVEN el usuario envía description y amount (> 0)
WHEN POST /api/v1/expenses
THEN crea el gasto con owner_id del JWT y created_by = user.id
AND responde 201

GIVEN falta description o amount
WHEN POST /api/v1/expenses
THEN responde 422

GIVEN amount <= 0
WHEN POST /api/v1/expenses
THEN responde 422

## Actualizar gasto
GIVEN el usuario envía JWT válido y campos parciales
WHEN PATCH /api/v1/expenses/{expenseId}
THEN actualiza SOLO los campos enviados
AND responde 200

GIVEN el expenseId no existe o es de otro owner
WHEN PATCH /api/v1/expenses/{expenseId}
THEN responde 404

## Eliminar gasto
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/expenses/{expenseId}
THEN elimina el gasto (hard delete)
AND responde 204

GIVEN el expenseId no existe o es de otro owner
WHEN DELETE /api/v1/expenses/{expenseId}
THEN responde 404

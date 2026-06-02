# Specs: Cajas

## Listar cajas
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/cashboxes
THEN devuelve cajas con active=true del mismo owner_id
AND ordena por created_at DESC
AND responde 200

## Crear caja
GIVEN el usuario envía nombre de caja
WHEN POST /api/v1/cashboxes
THEN crea la caja con owner_id del JWT y active=true
AND responde 201

GIVEN falta el campo name
WHEN POST /api/v1/cashboxes
THEN responde 422

## Actualizar caja
GIVEN el usuario envía JWT válido y campos a actualizar
WHEN PATCH /api/v1/cashboxes/{cashboxId}
THEN actualiza name, location_id, assigned_user_id
AND responde 200

GIVEN el cashboxId no existe o es de otro owner
WHEN PATCH /api/v1/cashboxes/{cashboxId}
THEN responde 404

## Desactivar caja (soft delete)
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/cashboxes/{cashboxId}
THEN marca active=false
AND responde 204

## Balance de caja por rango de fechas
GIVEN el usuario envía start_date, end_date y cashboxId válido
WHEN GET /api/v1/cashboxes/{cashboxId}/balance
THEN calcula la suma de ventas pagadas (status="paid") en ese rango
AND agrupa el resultado por payment_method
AND devuelve { total, count, by_payment_method: { cash, transfer, mobile_pay, credit } }
AND responde 200

GIVEN el cashboxId no existe o es de otro owner
WHEN GET /api/v1/cashboxes/{cashboxId}/balance
THEN responde 404

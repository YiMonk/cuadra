# Specs: Cierres de Caja

## Crear cierre
GIVEN el usuario envía JWT válido, cashbox_ids, rango de fechas y datos del cierre
WHEN POST /api/v1/cash-closings
THEN obtiene todas las ventas no canceladas y no cerradas en el rango dado
AND filtra por los cashbox_ids especificados (incluye sin caja si includes_unassigned=true)
AND calcula totales por método de pago
AND crea el cierre y marca las ventas con closed_in_closing_id
AND responde 201 con el cierre creado

GIVEN no hay ventas para el rango y cajas especificados
WHEN POST /api/v1/cash-closings
THEN igual crea el cierre con totales en 0
AND responde 201

## Listar cierres
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/cash-closings
THEN devuelve cierres del mismo owner_id
AND ordena por closed_at DESC
AND responde 200

## Obtener cierre por ID
GIVEN el usuario envía JWT válido y closingId del mismo owner
WHEN GET /api/v1/cash-closings/{closingId}
THEN responde 200 con el cierre completo (incluyendo totales y cashboxes)

GIVEN el closingId no existe o es de otro owner
WHEN GET /api/v1/cash-closings/{closingId}
THEN responde 404

## Último cierre del día
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/cash-closings/today/last
THEN devuelve el cierre más reciente del día actual (desde 00:00 hasta now)
AND responde 200

GIVEN no hay cierres hoy
WHEN GET /api/v1/cash-closings/today/last
THEN responde 404

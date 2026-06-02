# Specs: Sesiones de Caja

## Abrir sesión
GIVEN el usuario envía JWT válido y opcionalmente cashbox_id
WHEN POST /api/v1/cash-sessions/open
THEN verifica que NO exista ya una sesión abierta para ese cashbox_id
AND calcula debt_pending_at_open = suma de ventas pendientes del owner
AND crea la sesión con status="open" y opened_at=now()
AND responde 201

GIVEN ya existe una sesión abierta para ese cashbox_id
WHEN POST /api/v1/cash-sessions/open
THEN responde 400 con "ya hay una sesión abierta para esta caja por {cashierName}"

GIVEN se omite cashbox_id y ya hay sesión abierta sin caja asignada
WHEN POST /api/v1/cash-sessions/open
THEN responde 400 con "ya hay una sesión abierta sin caja asignada"

## Sesión activa del usuario
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/cash-sessions/current
THEN devuelve la sesión abierta más reciente del owner_id
AND responde 200

GIVEN no hay sesión abierta
WHEN GET /api/v1/cash-sessions/current
THEN responde 404

## Listar todas las sesiones
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/cash-sessions
THEN devuelve sesiones del mismo owner_id
AND ordena por opened_at DESC
AND responde 200

## Cerrar sesión
GIVEN el usuario envía sessionId válido, notes y discrepancies opcionales
WHEN POST /api/v1/cash-sessions/{sessionId}/close
THEN verifica que la sesión existe y pertenece al owner
AND calcula total_sales, total_by_method y debt_collected
AND calcula debt_pending_at_close = ventas pendientes actuales
AND cambia status="closed" y closed_at=now()
AND responde 200 con el resumen de la sesión

GIVEN la sesión ya está cerrada
WHEN POST /api/v1/cash-sessions/{sessionId}/close
THEN responde 400

GIVEN el sessionId no existe o es de otro owner
WHEN POST /api/v1/cash-sessions/{sessionId}/close
THEN responde 404

## Reporte de sesión
GIVEN el usuario envía JWT válido y sessionId válido
WHEN GET /api/v1/cash-sessions/{sessionId}/report
THEN devuelve sesión completa + detalle de ventas incluidas
AND responde 200

## Stats en tiempo real de sesión abierta
GIVEN el usuario envía JWT válido y sessionId de sesión abierta
WHEN GET /api/v1/cash-sessions/{sessionId}/stats
THEN calcula ventas desde opened_at hasta ahora
AND devuelve total_sales, total_by_method, sales_count, pending_count, paid_count
AND responde 200

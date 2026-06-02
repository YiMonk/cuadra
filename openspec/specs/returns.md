# Specs: Devoluciones

## Crear devolución
GIVEN el usuario envía saleId, lista de items a devolver y motivo (reason)
WHEN POST /api/v1/returns
THEN verifica que la venta existe y pertenece al owner
AND verifica que la venta tiene status="paid"
AND verifica que cada item devuelto existe en la venta original
AND verifica que la cantidad devuelta <= cantidad vendida
AND restaura stock de cada item (o variante) de forma atómica
AND registra movimientos en stock_movements (reason="return")
AND crea el registro de devolución con total_refund calculado
AND marca sale.has_returns = true
AND responde 201 con la devolución creada

GIVEN la venta no existe o es de otro owner
WHEN POST /api/v1/returns
THEN responde 404

GIVEN la venta tiene status != "paid"
WHEN POST /api/v1/returns
THEN responde 400 con "solo se pueden devolver ventas pagadas"

GIVEN un item devuelto no existe en la venta original
WHEN POST /api/v1/returns
THEN responde 400 con "{nombre} no está en esta venta"

GIVEN la cantidad devuelta > cantidad vendida del item
WHEN POST /api/v1/returns
THEN responde 400 con "no puedes devolver {n} de {nombre} (vendidos: {m})"

GIVEN la lista de items está vacía
WHEN POST /api/v1/returns
THEN responde 400 con "no hay productos para devolver"

GIVEN falta el campo reason
WHEN POST /api/v1/returns
THEN responde 422

## Listar devoluciones de una venta
GIVEN el usuario envía JWT válido y saleId del mismo owner
WHEN GET /api/v1/sales/{saleId}/returns
THEN devuelve todas las devoluciones asociadas a esa venta
AND responde 200

GIVEN la venta no tiene devoluciones
WHEN GET /api/v1/sales/{saleId}/returns
THEN responde 200 con lista vacía []

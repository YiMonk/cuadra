# Specs: Ventas

## Crear venta
GIVEN el usuario envía items, total y payment_method válido
WHEN POST /api/v1/sales
THEN verifica stock disponible para cada item (atómico)
AND descuenta stock de cada producto (o variante si tiene variant_id)
AND crea la venta con status="paid" si payment_method != "credit"
AND crea la venta con status="pending" si payment_method == "credit"
AND registra movimiento en stock_movements (reason="sale") por cada item
AND responde 201 con la venta y sus items

GIVEN un item tiene stock insuficiente
WHEN POST /api/v1/sales
THEN responde 400 con "stock insuficiente para {nombre}"
AND NO crea la venta
AND NO modifica ningún stock (rollback total)

GIVEN la lista items está vacía
WHEN POST /api/v1/sales
THEN responde 400 con "la venta debe tener al menos un producto"

GIVEN payment_method no es uno de: cash, transfer, mobile_pay, credit
WHEN POST /api/v1/sales
THEN responde 422

GIVEN la venta tiene exchange_rate_at_sale
THEN se guarda junto a la venta para historial

## Listar ventas
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/sales
THEN devuelve ventas del mismo owner_id
AND ordena por created_at DESC
AND acepta ?status=paid|pending|cancelled
AND acepta ?client_id= para ventas de un cliente
AND acepta ?start_date= y ?end_date= (ISO datetime)
AND acepta ?page= y ?page_size= (default 50, max 500)
AND responde 200

## Obtener venta por ID
GIVEN el usuario envía JWT válido y saleId del mismo owner
WHEN GET /api/v1/sales/{saleId}
THEN responde 200 con la venta y sus items

GIVEN el saleId no existe o es de otro owner
WHEN GET /api/v1/sales/{saleId}
THEN responde 404

## Actualizar estado de venta (cobrar deuda)
GIVEN una venta con status="pending" y se envía status="paid" con payment_method
WHEN PATCH /api/v1/sales/{saleId}/status
THEN cambia status a "paid"
AND registra paid_at = now()
AND responde 200

GIVEN la venta ya está cancelada
WHEN PATCH /api/v1/sales/{saleId}/status
THEN responde 400

## Cancelar venta
GIVEN el usuario envía JWT válido y motivo de cancelación
WHEN POST /api/v1/sales/{saleId}/cancel
THEN verifica que la venta no esté ya cancelada
AND cambia status a "cancelled"
AND restaura stock de cada item (atómico)
AND registra movimientos en stock_movements (reason="correction")
AND responde 200

GIVEN la venta ya está cancelada
WHEN POST /api/v1/sales/{saleId}/cancel
THEN responde 400 con "la venta ya fue cancelada"

## Pagar todas las deudas de un cliente
GIVEN el usuario envía payment_method y cashbox_id
WHEN POST /api/v1/sales/clients/{clientId}/pay-all-debts
THEN cambia a "paid" todas las ventas con status="pending" y client_id = clientId
AND registra paid_at = now() en cada una
AND responde 200 con { updated: N }

GIVEN el clientId no tiene ventas pendientes
WHEN POST /api/v1/sales/clients/{clientId}/pay-all-debts
THEN responde 200 con { updated: 0 }

## Resumen de ventas del día
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/sales/daily-summary
THEN devuelve revenue, pending_amount, count, avg_ticket del día actual
AND agrupa by payment_method
AND responde 200

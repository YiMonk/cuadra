# Specs: Reportes

## Resumen de ventas
GIVEN el usuario envía JWT válido y opcionalmente start_date, end_date, location_id
WHEN GET /api/v1/reports/sales-summary
THEN calcula sobre ventas con status="paid" del owner_id
AND devuelve: count, revenue, average_ticket, pending (suma ventas pending)
AND responde 200

GIVEN se envía location_id
THEN filtra solo ventas de esa sucursal

## Reporte de inventario
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/reports/inventory
THEN devuelve total_products (active=true)
AND devuelve low_stock_count (productos con stock <= min_stock_alert)
AND devuelve lista low_stock con id, name, stock de cada uno
AND devuelve total_inventory_value = suma(cost_price * stock) para productos con cost_price
AND responde 200

## Reporte de ganancias
GIVEN el usuario envía JWT válido y opcionalmente start_date, end_date
WHEN GET /api/v1/reports/profit
THEN calcula revenue = suma de ventas pagadas en el período
AND calcula expenses = suma de gastos en el período
AND calcula cost_of_goods = suma(item.cost_price * item.quantity) de ventas pagadas
AND devuelve { revenue, expenses, cost_of_goods, gross_profit: revenue - cost_of_goods, net_profit: gross_profit - expenses }
AND responde 200

## Tasa BCV
GIVEN cualquier cliente (sin auth requerida)
WHEN GET /api/v1/bcv-rate
THEN devuelve la tasa USD/VES más reciente
AND cachea el resultado 30 minutos (no golpea el scraper en cada request)
AND responde 200 con { rate: float, cached: bool, fetched_at: datetime }

GIVEN el scraper de BCV falla
WHEN GET /api/v1/bcv-rate
THEN devuelve la última tasa cacheada si existe
AND si no hay caché responde 502 con "no se pudo obtener la tasa BCV"

## Ventas por método de pago
GIVEN el usuario envía JWT válido y opcionalmente start_date, end_date
WHEN GET /api/v1/reports/by-payment-method
THEN devuelve total por método: { cash, transfer, mobile_pay, credit }
AND responde 200

## Top productos vendidos
GIVEN el usuario envía JWT válido y opcionalmente start_date, end_date, limit
WHEN GET /api/v1/reports/top-products
THEN agrega sale_items del período
AND ordena por total_quantity DESC
AND devuelve lista con product_id, product_name, total_quantity, total_revenue
AND responde 200

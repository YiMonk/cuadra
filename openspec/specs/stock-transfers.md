# Specs: Transferencias de Stock entre Sucursales

## Crear transferencia
GIVEN el usuario envía from_location_id, to_location_id y lista de items con cantidad
WHEN POST /api/v1/stock-transfers
THEN verifica que from_location_id != to_location_id
AND para cada item verifica stock disponible en from_location_id (atómico)
AND descuenta stock en la sucursal de origen
AND suma stock en la sucursal de destino
AND registra movimientos en stock_movements (reason="transfer_out" y "transfer_in")
AND crea el registro de la transferencia
AND responde 201

GIVEN from_location_id == to_location_id
WHEN POST /api/v1/stock-transfers
THEN responde 400 con "origen y destino no pueden ser la misma sucursal"

GIVEN la lista items está vacía
WHEN POST /api/v1/stock-transfers
THEN responde 400 con "selecciona al menos un producto"

GIVEN un item no tiene stock suficiente en from_location_id
WHEN POST /api/v1/stock-transfers
THEN responde 400 con "stock insuficiente en origen para {nombre}"
AND NO crea la transferencia
AND NO modifica ningún stock (rollback total)

GIVEN un producto no usa stockByLocation
WHEN POST /api/v1/stock-transfers
THEN migra el stock legacy al from_location_id (o sucursal del producto) antes de operar

GIVEN el from_location_id o to_location_id no existen o son de otro owner
WHEN POST /api/v1/stock-transfers
THEN responde 404

## Listar transferencias
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/stock-transfers
THEN devuelve transferencias del mismo owner_id
AND ordena por created_at DESC
AND acepta ?limit= (default 100)
AND responde 200

## Obtener transferencia por ID
GIVEN el usuario envía JWT válido y transferId del mismo owner
WHEN GET /api/v1/stock-transfers/{transferId}
THEN responde 200 con la transferencia completa (items, sucursales, estado)

GIVEN el transferId no existe o es de otro owner
WHEN GET /api/v1/stock-transfers/{transferId}
THEN responde 404

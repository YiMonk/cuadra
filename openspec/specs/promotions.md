# Specs: Promociones, Listas de Precio y Cupones

## ── Promociones ────────────────────────────────────────────

## Listar promociones
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/promotions
THEN devuelve todas las promociones del mismo owner_id
AND responde 200

## Crear promoción
GIVEN el usuario envía name y type (percentage | fixed | buy_x_get_y)
WHEN POST /api/v1/promotions
THEN crea la promoción con owner_id del JWT y active=true
AND responde 201

GIVEN falta name o type
WHEN POST /api/v1/promotions
THEN responde 422

GIVEN type no es uno de los valores permitidos
WHEN POST /api/v1/promotions
THEN responde 422

## Actualizar promoción
GIVEN el usuario envía JWT válido y campos parciales
WHEN PATCH /api/v1/promotions/{promotionId}
THEN actualiza SOLO los campos enviados
AND responde 200

GIVEN el promotionId no existe o es de otro owner
WHEN PATCH /api/v1/promotions/{promotionId}
THEN responde 404

## Desactivar promoción
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/promotions/{promotionId}
THEN marca active=false (soft delete)
AND responde 204

## ── Listas de Precio ───────────────────────────────────────

## Listar listas de precio
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/price-lists
THEN devuelve listas de precio del mismo owner_id
AND responde 200

## Crear lista de precio
GIVEN el usuario envía name y los items de la lista
WHEN POST /api/v1/price-lists
THEN crea la lista con owner_id del JWT
AND responde 201

## Actualizar lista de precio
GIVEN el usuario envía JWT válido y cambios en la lista
WHEN PATCH /api/v1/price-lists/{priceListId}
THEN actualiza los campos enviados
AND responde 200

## Eliminar lista de precio
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/price-lists/{priceListId}
THEN elimina la lista (hard delete)
AND responde 204

## ── Cupones ────────────────────────────────────────────────

## Listar cupones
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/coupons
THEN devuelve cupones del mismo owner_id
AND responde 200

## Crear cupón
GIVEN el usuario envía code y datos del descuento
WHEN POST /api/v1/coupons
THEN normaliza code a UPPERCASE y sin espacios
AND verifica que el code no exista para el mismo owner
AND crea el cupón con used_count=0
AND responde 201

GIVEN el code ya existe para el mismo owner
WHEN POST /api/v1/coupons
THEN responde 409 con "código ya en uso"

## Buscar cupón por código
GIVEN el usuario envía code
WHEN GET /api/v1/coupons/lookup?code={code}
THEN busca ignorando mayúsculas
AND responde 200 con el cupón si existe y está activo
AND responde 404 si no existe o está inactivo

## Registrar uso de cupón
GIVEN se crea una venta con coupon_code válido
WHEN POST /api/v1/coupons/{couponId}/increment-usage
THEN incrementa used_count en 1
AND responde 200

## Actualizar cupón
GIVEN el usuario envía JWT válido y campos parciales
WHEN PATCH /api/v1/coupons/{couponId}
THEN actualiza los campos, normalizando code si se envía
AND responde 200

## Eliminar cupón
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/coupons/{couponId}
THEN elimina el cupón (hard delete)
AND responde 204

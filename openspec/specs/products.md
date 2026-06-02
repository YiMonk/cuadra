# Specs: Productos

## Listar productos
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/products
THEN responde 200
AND devuelve solo productos con active=true del mismo owner_id
AND ordena por nombre ASC
AND acepta query param ?location_id= para filtrar por sucursal
AND acepta query param ?category= para filtrar por categoría

## Obtener producto por ID
GIVEN el usuario envía JWT válido y productId válido del mismo owner
WHEN GET /api/v1/products/{productId}
THEN responde 200 con el producto completo (incluyendo variants)

GIVEN el productId no existe o es de otro owner
WHEN GET /api/v1/products/{productId}
THEN responde 404

## Crear producto
GIVEN el usuario envía JWT válido y los campos name y price
WHEN POST /api/v1/products
THEN crea el producto con owner_id del JWT
AND responde 201 con el producto creado
AND stock defualt es 0 si no se envía

GIVEN falta el campo name o price
WHEN POST /api/v1/products
THEN responde 422

GIVEN price es un número negativo
WHEN POST /api/v1/products
THEN responde 422

## Actualizar producto
GIVEN el usuario envía JWT válido y campos parciales
WHEN PATCH /api/v1/products/{productId}
THEN actualiza SOLO los campos enviados
AND responde 200 con el producto actualizado

GIVEN el productId no existe o es de otro owner
WHEN PATCH /api/v1/products/{productId}
THEN responde 404

## Eliminar producto (soft delete)
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/products/{productId}
THEN marca active=false
AND responde 204
AND el producto ya no aparece en GET /products

GIVEN el productId no existe o es de otro owner
WHEN DELETE /api/v1/products/{productId}
THEN responde 404

## Ajustar stock
GIVEN el usuario envía adjustment positivo (restock) y reason="restock"
WHEN POST /api/v1/products/{productId}/adjust-stock
THEN incrementa product.stock en el valor de adjustment
AND registra un movimiento en stock_movements
AND responde 200 con el producto actualizado

GIVEN el usuario envía adjustment negativo (merma) y reason="waste"
WHEN POST /api/v1/products/{productId}/adjust-stock
THEN decrementa product.stock
AND registra movimiento con reason="waste"
AND responde 200

GIVEN el ajuste resultaría en stock negativo
WHEN POST /api/v1/products/{productId}/adjust-stock
THEN responde 400 con "stock insuficiente"
AND NO modifica el stock

GIVEN adjustment=0
WHEN POST /api/v1/products/{productId}/adjust-stock
THEN responde 422

## Importación masiva
GIVEN el usuario envía lista de productos (hasta 500)
WHEN POST /api/v1/products/bulk
THEN crea todos los productos en la misma transacción
AND responde 201 con { inserted: N }

GIVEN la lista está vacía
WHEN POST /api/v1/products/bulk
THEN responde 422

## Variantes de producto
GIVEN un producto tiene variants en el campo JSONB
THEN el stock de cada variante es independiente
AND el stock total del producto = suma de stocks de variantes si las hay
AND al ajustar stock de una variante se especifica variant_id

# Specs: Clientes

## Listar clientes
GIVEN el usuario envía JWT válido
WHEN GET /api/v1/clients
THEN devuelve clientes con active=true del mismo owner_id
AND ordena por nombre ASC
AND responde 200

## Obtener cliente por ID
GIVEN el usuario envía JWT válido y clientId del mismo owner
WHEN GET /api/v1/clients/{clientId}
THEN responde 200 con el cliente (id, name, phone, email, address, notes, total_debt)

GIVEN el clientId no existe o es de otro owner
WHEN GET /api/v1/clients/{clientId}
THEN responde 404

## Crear cliente
GIVEN el usuario envía nombre (requerido) y datos opcionales
WHEN POST /api/v1/clients
THEN crea el cliente con owner_id del JWT y total_debt=0
AND responde 201

GIVEN falta el campo name
WHEN POST /api/v1/clients
THEN responde 422

## Actualizar cliente
GIVEN el usuario envía JWT válido y campos parciales
WHEN PATCH /api/v1/clients/{clientId}
THEN actualiza SOLO los campos enviados
AND NO permite modificar total_debt directamente (se calcula desde ventas)
AND responde 200

GIVEN el clientId no existe o es de otro owner
WHEN PATCH /api/v1/clients/{clientId}
THEN responde 404

## Eliminar cliente (soft delete)
GIVEN el usuario envía JWT válido
WHEN DELETE /api/v1/clients/{clientId}
THEN verifica que el cliente NO tenga ventas con status="pending"
AND marca active=false
AND responde 204

GIVEN el cliente tiene ventas pendientes
WHEN DELETE /api/v1/clients/{clientId}
THEN responde 400 con "no se puede eliminar un cliente con deudas pendientes"
AND NO lo elimina

GIVEN el clientId no existe o es de otro owner
WHEN DELETE /api/v1/clients/{clientId}
THEN responde 404

## Deuda total del cliente
GIVEN el usuario consulta un cliente
THEN total_debt refleja la suma de todas sus ventas con status="pending"
AND se actualiza automáticamente al crear/cancelar ventas

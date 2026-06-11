# Specs: Companies

## Crear empresa

GIVEN un owner autenticado envía name y opcionalmente rif, modules_enabled[]
WHEN POST /api/v1/companies
THEN crea la empresa con owner_user_id = user.id del JWT
AND modules_enabled contiene al menos un módulo válido
AND si modules_enabled no se envía, falla con 422
AND devuelve la empresa creada con su id
AND responde 201

GIVEN un owner envía name vacío o ausente
WHEN POST /api/v1/companies
THEN responde 422
AND NO crea la empresa

GIVEN un owner envía modules_enabled como lista vacía
WHEN POST /api/v1/companies
THEN responde 422 con detail "modules_enabled must contain at least one module"
AND NO crea la empresa

GIVEN un cashier o viewer autenticado intenta crear una empresa
WHEN POST /api/v1/companies
THEN responde 403

## Listar empresas propias

GIVEN un owner autenticado
WHEN GET /api/v1/companies
THEN devuelve solo las empresas donde owner_user_id = user.id del JWT
AND no incluye empresas de otros owners
AND responde 200

GIVEN un owner que no tiene empresas aún
WHEN GET /api/v1/companies
THEN devuelve lista vacía []
AND responde 200

GIVEN un cashier o viewer autenticado
WHEN GET /api/v1/companies
THEN responde 403

## Obtener empresa por id

GIVEN un owner autenticado y companyId pertenece a ese owner
WHEN GET /api/v1/companies/{companyId}
THEN devuelve los datos completos de la empresa
AND responde 200

GIVEN un owner autenticado y companyId pertenece a otro owner
WHEN GET /api/v1/companies/{companyId}
THEN responde 404

GIVEN el companyId no existe
WHEN GET /api/v1/companies/{companyId}
THEN responde 404

## Actualizar empresa

GIVEN un owner autenticado y companyId pertenece a ese owner
WHEN PATCH /api/v1/companies/{companyId}
THEN actualiza name, rif, modules_enabled, plan
AND responde 200 con empresa actualizada

GIVEN un owner envía modules_enabled como lista vacía en el PATCH
WHEN PATCH /api/v1/companies/{companyId}
THEN responde 422 con detail "modules_enabled must contain at least one module"

GIVEN el companyId no existe o pertenece a otro owner
WHEN PATCH /api/v1/companies/{companyId}
THEN responde 404

GIVEN un cashier o viewer autenticado intenta actualizar
WHEN PATCH /api/v1/companies/{companyId}
THEN responde 403

## Borrado físico no permitido

GIVEN cualquier usuario autenticado
WHEN DELETE /api/v1/companies/{companyId}
THEN responde 405 Method Not Allowed
AND la empresa permanece en la base de datos

## Multi-empresa

GIVEN un owner crea una segunda empresa con nombre diferente
WHEN GET /api/v1/companies
THEN devuelve ambas empresas en la lista
AND cada empresa tiene su propio id UUID
AND no comparten datos (locations, sales, products)

GIVEN un owner tiene dos empresas y opera en el contexto de company_id A (JWT)
WHEN accede a datos de la empresa B directamente
THEN el backend deniega el acceso con 403 o 404 según corresponda

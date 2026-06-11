# Specs: Company Locations

## Listar sucursales de una empresa

GIVEN un owner autenticado con company_id en JWT
WHEN GET /api/v1/companies/{companyId}/locations
THEN devuelve las sucursales con owner_id = companyId y active=true
AND no incluye sucursales de otras empresas
AND responde 200

GIVEN company_id del JWT no coincide con companyId del path
WHEN GET /api/v1/companies/{companyId}/locations
THEN responde 403

GIVEN la empresa no tiene sucursales
WHEN GET /api/v1/companies/{companyId}/locations
THEN devuelve lista vacía []
AND responde 200

## Crear sucursal

GIVEN un owner autenticado con company_id en JWT y envía name
WHEN POST /api/v1/companies/{companyId}/locations
THEN crea la sucursal con owner_id = companyId, active=true
AND responde 201 con la sucursal creada

GIVEN un owner envía name vacío o ausente
WHEN POST /api/v1/companies/{companyId}/locations
THEN responde 422
AND NO crea la sucursal

GIVEN company_id del JWT no coincide con companyId del path
WHEN POST /api/v1/companies/{companyId}/locations
THEN responde 403

GIVEN un cashier o viewer autenticado intenta crear sucursal
WHEN POST /api/v1/companies/{companyId}/locations
THEN responde 403

## Actualizar sucursal

GIVEN un owner autenticado con company_id en JWT y locationId pertenece a esa empresa
WHEN PATCH /api/v1/companies/{companyId}/locations/{locationId}
THEN actualiza name, address, phone
AND responde 200 con sucursal actualizada

GIVEN el locationId no existe o pertenece a otra empresa
WHEN PATCH /api/v1/companies/{companyId}/locations/{locationId}
THEN responde 404

GIVEN company_id del JWT no coincide con companyId del path
WHEN PATCH /api/v1/companies/{companyId}/locations/{locationId}
THEN responde 403

GIVEN un cashier o viewer autenticado intenta actualizar
WHEN PATCH /api/v1/companies/{companyId}/locations/{locationId}
THEN responde 403

## Desactivar sucursal

GIVEN un owner autenticado con company_id en JWT y locationId pertenece a esa empresa
WHEN DELETE /api/v1/companies/{companyId}/locations/{locationId}
THEN marca active=false en la sucursal
AND responde 204
AND la sucursal no aparece en futuros GET

GIVEN el locationId no existe o pertenece a otra empresa
WHEN DELETE /api/v1/companies/{companyId}/locations/{locationId}
THEN responde 404

GIVEN un cashier o viewer autenticado intenta desactivar
WHEN DELETE /api/v1/companies/{companyId}/locations/{locationId}
THEN responde 403

## Compatibilidad con endpoints existentes

GIVEN un owner autenticado con company_id en JWT
WHEN GET /api/v1/locations (endpoint legacy)
THEN devuelve las sucursales de la empresa activa (owner_id = company_id del JWT)
AND el comportamiento es equivalente al GET por companyId

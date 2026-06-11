# Specs: Access Accounts

## Crear cuenta de acceso

GIVEN un owner autenticado con company_id en JWT envía email, password, role, module_access[]
WHEN POST /api/v1/companies/{companyId}/access-accounts
THEN crea un User con role = role enviado, company_id = companyId, module_access = module_access[]
AND hace hash del password con bcrypt (cost 12)
AND owner_id del User = companyId
AND active = true
AND devuelve los datos de la cuenta (id, email, name, role, module_access, active)
AND responde 201

GIVEN el email enviado ya existe en la tabla users
WHEN POST /api/v1/companies/{companyId}/access-accounts
THEN responde 409 Conflict con detail "email already registered"
AND NO crea la cuenta

GIVEN module_access[] viene como lista vacía
WHEN POST /api/v1/companies/{companyId}/access-accounts
THEN responde 422 con detail "module_access must contain at least one module"
AND NO crea la cuenta

GIVEN role enviado es diferente de "cashier" o "viewer"
WHEN POST /api/v1/companies/{companyId}/access-accounts
THEN responde 422 con detail "invalid role for access account"

GIVEN password tiene menos de 8 caracteres
WHEN POST /api/v1/companies/{companyId}/access-accounts
THEN responde 422
AND NO crea la cuenta

GIVEN company_id del JWT no coincide con companyId del path
WHEN POST /api/v1/companies/{companyId}/access-accounts
THEN responde 403

GIVEN un cashier o viewer intenta crear una cuenta de acceso
WHEN POST /api/v1/companies/{companyId}/access-accounts
THEN responde 403

## Listar cuentas de acceso

GIVEN un owner autenticado con company_id en JWT
WHEN GET /api/v1/companies/{companyId}/access-accounts
THEN devuelve todos los Users con company_id = companyId y role en (cashier, viewer)
AND no incluye el propio owner
AND incluye cuentas activas e inactivas
AND responde 200

GIVEN company_id del JWT no coincide con companyId del path
WHEN GET /api/v1/companies/{companyId}/access-accounts
THEN responde 403

## Actualizar cuenta de acceso

GIVEN un owner autenticado con company_id en JWT y accountId pertenece a esa empresa
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}
THEN puede actualizar name, role, module_access[]
AND responde 200 con cuenta actualizada

GIVEN el accountId no existe o pertenece a otra empresa
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}
THEN responde 404

GIVEN module_access[] viene como lista vacía en el PATCH
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}
THEN responde 422 con detail "module_access must contain at least one module"

## Cambiar contraseña de cuenta de acceso

GIVEN un owner autenticado con company_id en JWT y accountId pertenece a esa empresa
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}/password
THEN el owner envía new_password sin necesitar el password actual de la cuenta
AND actualiza el password_hash de la cuenta
AND responde 200

GIVEN new_password tiene menos de 8 caracteres
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}/password
THEN responde 422

GIVEN el accountId no existe o pertenece a otra empresa
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}/password
THEN responde 404

GIVEN un cashier o viewer intenta cambiar el password de otra cuenta
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}/password
THEN responde 403

## Activar / desactivar cuenta de acceso

GIVEN un owner autenticado con company_id en JWT y accountId pertenece a esa empresa
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}/status
AND el body incluye active = false
THEN marca la cuenta como active=false
AND si esa cuenta tiene tokens activos, dichos tokens son rechazados en el próximo request
AND responde 200

GIVEN un owner envía active = true para una cuenta desactivada
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}/status
THEN marca la cuenta como active=true
AND la cuenta puede volver a hacer login
AND responde 200

GIVEN un cashier o viewer intenta desactivar/activar una cuenta
WHEN PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}/status
THEN responde 403

## Login de cuenta de acceso

GIVEN una cuenta de acceso (cashier o viewer) envía email y password correctos
WHEN POST /api/v1/auth/login
THEN responde 200
AND devuelve JWT access token con user_id y company_id = user.company_id
AND devuelve refresh token
AND el flujo NO pasa por company-select (company_id ya está fijo en la cuenta)

GIVEN una cuenta de acceso con active=false intenta hacer login
WHEN POST /api/v1/auth/login
THEN responde 401 con detail "account disabled"

GIVEN una cuenta de acceso envía password incorrecto
WHEN POST /api/v1/auth/login
THEN responde 401 con el mismo mensaje que email inexistente

# Specs: Module Access Control

## company_id obligatorio en requests protegidos

GIVEN una request llega con JWT que NO contiene company_id
WHEN cualquier endpoint protegido que requiere contexto de empresa
THEN responde 403 con detail "company context required"
AND el endpoint NO procesa la request

GIVEN una request llega con JWT que contiene user_id y company_id válidos
WHEN cualquier endpoint protegido
THEN el backend resuelve el contexto de empresa correctamente
AND la request sigue su flujo normal

## Validación de acceso a módulo

GIVEN un usuario con module_access = ["ventas", "inventario"] en su User
WHEN hace una request a un endpoint del módulo "ventas"
THEN el backend permite el acceso
AND responde según la lógica normal del endpoint

GIVEN un usuario con module_access = ["ventas"]
WHEN hace una request a un endpoint del módulo "caja"
THEN responde 403 con detail "module access denied"
AND no se ejecuta la lógica del endpoint

GIVEN un owner autenticado (role = "owner")
WHEN hace una request a cualquier endpoint de cualquier módulo de su empresa
THEN el backend permite el acceso sin validar module_access
AND owner tiene acceso total a su empresa

## Control por método HTTP (viewer vs cashier)

GIVEN un usuario con role = "viewer" en módulo "ventas"
WHEN hace GET /api/v1/sales (o cualquier GET del módulo ventas)
THEN el backend permite la lectura
AND responde 200 con los datos

GIVEN un usuario con role = "viewer" en módulo "ventas"
WHEN hace POST /api/v1/sales (o cualquier POST/PUT/PATCH/DELETE del módulo ventas)
THEN responde 403 con detail "read-only access"
AND no se crea ni modifica ningún dato

GIVEN un usuario con role = "cashier" en módulo "ventas"
WHEN hace POST /api/v1/sales
THEN el backend permite la operación de escritura
AND responde según la lógica normal del endpoint

GIVEN un usuario con role = "cashier" en módulo "caja"
WHEN hace POST /api/v1/cashboxes
THEN el backend permite la operación
AND responde según la lógica normal del endpoint

## Dependency require_module_access

GIVEN un endpoint usa Depends(require_module_access("ventas", action="write"))
WHEN un viewer del módulo ventas hace POST a ese endpoint
THEN responde 403

GIVEN un endpoint usa Depends(require_module_access("ventas", action="read"))
WHEN un viewer del módulo ventas hace GET a ese endpoint
THEN permite el acceso

GIVEN un endpoint usa Depends(require_module_access("ventas", action="write"))
WHEN un cashier del módulo ventas hace POST
THEN permite el acceso

GIVEN un endpoint usa Depends(require_module_access("inventario", action="write"))
WHEN un cashier que solo tiene módulo "ventas" hace POST
THEN responde 403 con detail "module access denied"

## Endpoints excluidos del control de módulo

GIVEN cualquier usuario autenticado
WHEN hace requests a /api/v1/auth/* (login, refresh, logout)
THEN no se aplica validación de módulo
AND los endpoints funcionan normalmente

GIVEN un owner autenticado
WHEN hace requests a /api/v1/companies/* (gestión de empresas y cuentas)
THEN no se aplica validación de módulo por módulo de negocio
AND se aplica solo la validación de ownership de empresa

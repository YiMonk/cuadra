# Specs: Company Select Flow

## Login con una sola empresa

GIVEN un owner autenticado que tiene exactamente 1 empresa
WHEN POST /api/v1/auth/login con credenciales correctas
THEN el backend emite JWT access token con user_id y company_id = id de su única empresa
THEN el backend emite refresh token también con company_id
AND el frontend redirige directamente a /module-select
AND NO muestra la pantalla /company-select

## Login con múltiples empresas

GIVEN un owner autenticado que tiene 2 o más empresas
WHEN POST /api/v1/auth/login con credenciales correctas
THEN el backend emite JWT access token con user_id y company_id = null (ausente)
THEN el backend incluye en la respuesta companies[] con lista resumida (id, name) de sus empresas
AND el frontend redirige a /company-select
AND el token sin company_id NO puede acceder a endpoints protegidos de negocio

## Pantalla /company-select

GIVEN el frontend detecta que el JWT no contiene company_id al cargar la app
WHEN el usuario está en cualquier ruta protegida
THEN el frontend redirige a /company-select

GIVEN el usuario en /company-select selecciona una empresa de la lista
WHEN POST /api/v1/auth/select-company con company_id seleccionado
THEN el backend verifica que ese company_id pertenece al owner (owner_user_id = user.id)
AND emite nuevo JWT access token con user_id + company_id = empresa seleccionada
AND emite nuevo refresh token con company_id
AND el frontend guarda los nuevos tokens en localStorage
AND el frontend guarda company_id en localStorage con clave "cuadra_active_company"
AND redirige a /module-select

GIVEN el company_id enviado no pertenece al owner autenticado
WHEN POST /api/v1/auth/select-company
THEN responde 403 con detail "company not owned by user"

GIVEN el usuario en /company-select no selecciona empresa y cierra la pantalla
WHEN el usuario intenta navegar a cualquier ruta protegida
THEN permanece en /company-select o es redirigido de vuelta a ella

## Cambio de empresa activa

GIVEN un owner que operó con empresa A y quiere cambiar a empresa B
WHEN accede a la opción "cambiar empresa" en la UI
THEN el frontend redirige a /company-select
AND el frontend NO descarta automáticamente el token actual hasta que el usuario seleccione otra empresa

GIVEN el usuario selecciona empresa B en /company-select
WHEN POST /api/v1/auth/select-company con company_id = B
THEN se emite nuevo JWT con company_id = B
AND el frontend reemplaza el token y "cuadra_active_company" en localStorage
AND el frontend redirige a /module-select con contexto de empresa B

## JWT sin company_id bloqueado en backend

GIVEN una request llega con JWT válido que tiene company_id = null (ausente)
WHEN cualquier endpoint protegido de negocio (ventas, productos, caja, etc.)
THEN responde 403 con detail "company context required"

GIVEN una request llega con JWT válido que tiene company_id de una empresa inexistente
WHEN cualquier endpoint protegido de negocio
THEN responde 403 con detail "company not found"

## Cuentas de acceso (cashier/viewer) — sin company-select

GIVEN una cuenta de acceso (cashier o viewer) hace login con credenciales correctas
WHEN POST /api/v1/auth/login
THEN el backend emite JWT con user_id + company_id fijo (user.company_id)
AND el frontend recibe un token ya con company_id
AND el frontend redirige directamente a /module-select
AND NO pasa por /company-select

## Persistencia al recargar la página

GIVEN un owner que seleccionó empresa A previamente tiene tokens en localStorage
WHEN recarga la página (F5)
THEN el frontend lee el access token, detecta company_id = A en el JWT
AND redirige a /module-select con contexto de empresa A activa
AND NO vuelve a mostrar /company-select

# Specs: Autenticación

## Registro
GIVEN un usuario nuevo envía email, password y nombre
WHEN POST /api/v1/auth/register
THEN crea el usuario en PostgreSQL con role "owner"
AND hace hash del password con bcrypt (cost 12)
AND owner_id apunta al propio id (el owner se registra a sí mismo)
AND devuelve JWT access token válido por 24h
AND devuelve datos básicos del usuario (id, email, nombre, role)
AND responde 201

GIVEN un usuario envía un email que ya existe
WHEN POST /api/v1/auth/register
THEN responde 409 Conflict
AND NO crea duplicado en la BD
AND devuelve detail "email already registered"

GIVEN un usuario envía un password menor a 8 caracteres
WHEN POST /api/v1/auth/register
THEN responde 422
AND NO crea el usuario

GIVEN un usuario envía email sin formato válido
WHEN POST /api/v1/auth/register
THEN responde 422

## Login
GIVEN un usuario registrado envía email y password correctos
WHEN POST /api/v1/auth/login
THEN responde 200
AND devuelve JWT access token (24h)
AND devuelve refresh token (7 días)
AND devuelve perfil básico del usuario

GIVEN un usuario envía password incorrecto
WHEN POST /api/v1/auth/login
THEN responde 401
AND NO devuelve token
AND NO revela si el email existe (mismo mensaje que email inexistente)

GIVEN un usuario envía un email que no existe
WHEN POST /api/v1/auth/login
THEN responde 401
AND devuelve el mismo mensaje que password incorrecto

GIVEN un usuario con active=false intenta hacer login
WHEN POST /api/v1/auth/login
THEN responde 401
AND devuelve detail "account disabled"

## Refresh Token
GIVEN un usuario envía un refresh token válido
WHEN POST /api/v1/auth/refresh
THEN responde 200
AND devuelve un nuevo access token (24h)
AND el refresh token original sigue siendo válido

GIVEN un usuario envía un refresh token expirado o inválido
WHEN POST /api/v1/auth/refresh
THEN responde 401

## Rutas protegidas
GIVEN una request llega sin JWT en el header Authorization
WHEN cualquier endpoint protegido
THEN responde 401

GIVEN una request llega con JWT expirado
WHEN cualquier endpoint protegido
THEN responde 401 con detail "token expired"

GIVEN una request llega con JWT malformado
WHEN cualquier endpoint protegido
THEN responde 401

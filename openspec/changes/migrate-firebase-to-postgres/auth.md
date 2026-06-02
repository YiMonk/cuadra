# Specs: Autenticación

## Registro
GIVEN un usuario nuevo envía email, cedula, password y nombre
WHEN POST /api/v1/auth/register
THEN crea el usuario en PostgreSQL
AND hace hash del password con bcrypt (cost 12)
AND devuelve JWT token válido por 24h
AND devuelve datos básicos del usuario (id, email, nombre,cedula)
AND responde 201

GIVEN un usuario envía un email que ya existe o cedula que ya existe
WHEN POST /api/v1/auth/register
THEN responde 409 Conflict
AND NO crea duplicado en la BD
AND devuelve mensaje "email already registered" o "cedula already registered"

GIVEN un usuario envía un password menor a 8 caracteres
WHEN POST /api/v1/auth/register
THEN responde 422
AND NO crea el usuario

## Login
GIVEN un usuario registrado envía email y password correctos
WHEN POST /api/v1/auth/login
THEN responde 200
AND devuelve JWT access token (24h)
AND devuelve refresh token (7 días)

GIVEN un usuario envía password incorrecto
WHEN POST /api/v1/auth/login
THEN responde 401
AND NO devuelve token
AND NO revela si el email existe o no (seguridad)

GIVEN un usuario envía un email que no existe
WHEN POST /api/v1/auth/login
THEN responde 401
AND devuelve el mismo mensaje que password incorrecto

## Rutas protegidas
GIVEN una request llega sin JWT en el header
WHEN cualquier endpoint protegido
THEN responde 401

GIVEN una request llega con JWT expirado
WHEN cualquier endpoint protegido
THEN responde 401 con mensaje "token expired"
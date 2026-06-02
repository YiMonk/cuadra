# Diseño Técnico

## Stack nuevo
- Backend: Python 3.11 + FastAPI
- ORM: SQLAlchemy (async)
- Migrations: Alembic
- Auth: JWT (python-jose) + bcrypt
- DB: PostgreSQL en Neon (serverless)
- Testing: pytest + httpx

## Estructura del backend
backend/
  app/
    main.py
    database.py         ← conexión a Neon
    models/             ← modelos SQLAlchemy
      user.py
    routers/            ← endpoints por dominio
      auth.py
      users.py
    schemas/            ← Pydantic (validación)
      auth.py
      users.py
    services/           ← lógica de negocio
      auth_service.py
  alembic/              ← migrations
  tests/
    conftest.py         ← harness / fixtures
    test_auth.py
    test_users.py
  .env                  ← secrets (nunca en git)

## Contrato de API (lo que el front va a consumir)
Base URL: /api/v1

Auth:
  POST /api/v1/auth/register
  POST /api/v1/auth/login
  POST /api/v1/auth/logout
  POST /api/v1/auth/refresh-token

Users:
  GET  /api/v1/users/me
  PUT  /api/v1/users/me
  DELETE /api/v1/users/me

## Variables de entorno necesarias
DATABASE_URL=postgresql+asyncpg://...neon.tech/dbname
JWT_SECRET=...
JWT_EXPIRE_HOURS=24

## Que hacer luego de la migracion y nueva implementacion

-Limpiar todo el codigo que tenga que ver con firebase y crear las pruebas unitarias y de integracion para cada endpoint del backend, los tests deben estar en la carpeta tests/ 
## Why

El backend usa SQLite + `create_all` en dev, lo que bloquea el deploy a producción. Para lanzar en Neon (PostgreSQL serverless) se necesita un esquema Alembic versionado que funcione con asyncpg y una configuración de entorno limpia que separe dev de prod.

## What Changes

- Generar la migración inicial de Alembic con el esquema completo (todos los modelos actuales)
- Configurar `alembic/env.py` para correr async con asyncpg y soporte multi-driver (SQLite dev / PostgreSQL prod)
- Agregar `DATABASE_URL` de Neon al `.env` de producción (variable de entorno, nunca en código)
- Eliminar `create_all` del lifespan en producción — solo Alembic gestiona el schema en prod
- Documentar el workflow de migraciones para el equipo
- Verificar que los 185 tests pasen contra SQLite (CI) y que el schema se aplique limpiamente en Neon

## Capabilities

### New Capabilities

- `db-migrations`: Gestión versionada del schema con Alembic — `alembic upgrade head` aplica el schema completo en cualquier entorno

### Modified Capabilities

- `auth`: Sin cambio de requisitos — solo migración de SQLite a PostgreSQL como storage
- `products`: Sin cambio de requisitos
- `sales`: Sin cambio de requisitos

## Impact

- `Backend/alembic/` — nuevo archivo de migración inicial + env.py actualizado
- `Backend/app/main.py` — `create_all` condicionado solo a `not is_production`
- `Backend/.env` — `DATABASE_URL` apunta a Neon en prod
- `Backend/requirements.txt` — agregar `asyncpg` y `psycopg2-binary` si no están
- Sin impacto en frontend ni en contratos de API

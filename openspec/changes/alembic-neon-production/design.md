## Context

El backend usa Python 3.14 + FastAPI + SQLAlchemy async. En dev corre SQLite (aiosqlite) con `Base.metadata.create_all` en el lifespan. En producción irá a Neon (PostgreSQL serverless).

Estado actual de Alembic:
- `alembic/env.py` ya tiene soporte async correcto
- `database.py` ya diferencia SQLite/PostgreSQL en `_build_engine`
- `main.py` ya tiene `if not settings.is_production` guardando `create_all`
- Solo existe 1 revision (`c77bbf9da2cf`) que solo agrega 2 columnas a `users`, sin migración inicial del schema

El problema: en una Neon DB vacía, `alembic upgrade head` solo ejecutaría las 2 columnas de `c77bbf9da2cf`, sin crear ninguna tabla — la DB quedaría rota.

asyncpg 0.31.0 ya tiene wheel para Python 3.14 (`cp314`), el comentario en requirements.txt que lo bloqueaba está desactualizado.

## Goals / Non-Goals

**Goals:**
- Crear migración inicial (`0001_init`) que genera todo el schema desde cero
- Hacer que `c77bbf9da2cf` dependa de `0001_init` (o eliminarlo al fusionarse en el init)
- Agregar `asyncpg` a requirements.txt y descomentarlo
- Configurar `.env` con `DATABASE_URL` para Neon (via variable de entorno)
- Verificar que `alembic upgrade head` en DB vacía deja el schema completo operativo

**Non-Goals:**
- Migrar datos existentes (dev.db no tiene datos relevantes)
- Cambiar la API ni los contratos de endpoints
- Configurar CI/CD pipeline (eso es un change separado)

## Decisions

### D1: Fusionar init + c77bbf9da2cf en una sola migración inicial

**Decisión**: Reemplazar `c77bbf9da2cf` con una sola migración `0001_init` que incluye todo el schema actual (incluidos `terms_accepted` y `onboarding_completed_at`).

**Alternativa descartada**: Crear `0001_init` y hacer que `c77bbf9da2cf` lo tenga como `down_revision`. Funciona, pero genera confusión — la primera migración real crea todo excepto 2 columnas, y la segunda las agrega. Innecesariamente fragmentado para un proyecto sin usuarios en prod.

**Rationale**: La DB de producción es nueva y vacía. Una sola migración inicial es más limpia, fácil de auditar y no crea falsa deuda técnica.

### D2: Usar asyncpg como driver de producción (no psycopg3)

**Decisión**: `asyncpg` 0.31.0 que ya tiene wheel `cp314`.

**Alternativa descartada**: `psycopg[async]` (psycopg3). También funciona con Python 3.14 y tiene mejor soporte de `COPY`, pero asyncpg es más rápido para operaciones OLTP simples y el resto de la codebase ya asume el driver asyncpg (`postgresql+asyncpg://`).

### D3: DATABASE_URL en .env, driver seleccionado por prefijo de URL

**Decisión**: `database.py` ya inspecciona el prefijo de la URL (`if "postgresql" in url`) para configurar el pool. Basta con cambiar `DATABASE_URL` en el entorno — sin cambio de código.

**Connection string format**:
- Dev: `sqlite+aiosqlite:///./dev.db`
- Prod: `postgresql+asyncpg://user:pass@host/dbname?sslmode=require`

### D4: `alembic upgrade head` es el único mecanismo de schema en producción

**Decisión**: `create_all` sigue activo solo cuando `not is_production`. En prod (Neon), el deploy debe correr `alembic upgrade head` antes de arrancar la app.

## Risks / Trade-offs

- **[Risk] asyncpg + Neon SSL**: Neon requiere `sslmode=require`. asyncpg lo acepta como query param en la URL pero puede fallar si el certificado no está en el trust store del entorno.
  → **Mitigation**: Usar `?sslmode=require` en la URL de Neon y verificar que la conexión exitosa sea parte del smoke test de deploy.

- **[Risk] Alembic autogenerate no detecta tipos JSONB en SQLite**: Las columnas `JSONB` (stock_by_location, variants, etc.) se crean como `JSON` en SQLite. En PostgreSQL debemos asegurarnos de usar `sa.JSON` (que Alembic mapea a JSONB en PG por la configuración de los modelos).
  → **Mitigation**: Revisar manualmente la migración generada y ajustar tipos si es necesario.

- **[Risk] Python 3.14 en entorno de deploy (Neon/Render/Railway)**: Los hosting providers pueden no tener Python 3.14 en sus builders.
  → **Mitigation**: Usar Python 3.12 en el Dockerfile/runtime de prod. El código es compatible. asyncpg tiene wheel para ambos.

## Migration Plan

1. Instalar asyncpg en el venv local
2. Borrar `c77bbf9da2cf` de `alembic/versions/`
3. Generar nueva migración con `alembic revision --autogenerate -m "init"`
4. Revisar el archivo generado — verificar que crea todas las tablas
5. Ejecutar `alembic upgrade head` contra SQLite limpio para smoke test
6. Agregar `DATABASE_URL` de Neon en variable de entorno
7. Ejecutar `alembic upgrade head` contra Neon y verificar tablas con `psql`
8. Correr los 185 tests para confirmar que no hay regresión

**Rollback**: Neon tiene point-in-time recovery. Si `upgrade head` falla a mitad, correr `alembic downgrade base` o restaurar snapshot.

## Open Questions

- ¿Qué runtime/hosting se usará para el backend en producción? (Render, Railway, Fly.io, Docker en VPS) — afecta si podemos usar Python 3.14 directamente o necesitamos 3.12.
- ¿Neon ya tiene el proyecto/branch creado, o hay que generarlo?

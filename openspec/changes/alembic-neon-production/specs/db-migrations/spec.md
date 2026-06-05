## ADDED Requirements

### Requirement: Schema completo en migración inicial
El sistema SHALL tener una migración Alembic `0001_init` que crea todas las tablas del schema en una DB vacía. Esta migración es la única con `down_revision = None`.

#### Scenario: Upgrade en DB vacía crea todas las tablas
- **WHEN** se ejecuta `alembic upgrade head` contra una DB PostgreSQL vacía
- **THEN** todas las tablas del schema existen y están listas para operar

#### Scenario: Upgrade es idempotente si el schema ya existe
- **WHEN** se ejecuta `alembic upgrade head` dos veces consecutivas
- **THEN** la segunda ejecución no produce error y no modifica el schema

### Requirement: Driver asyncpg para PostgreSQL
El sistema SHALL usar `asyncpg` como driver cuando `DATABASE_URL` contiene `postgresql`. No se requiere cambio de código — el driver se selecciona por el prefijo de la URL.

#### Scenario: Conexión exitosa a Neon con SSL
- **WHEN** `DATABASE_URL` tiene el formato `postgresql+asyncpg://...?sslmode=require`
- **THEN** la app arranca sin error y el health check `GET /api/v1/health` responde 200

#### Scenario: Conexión a SQLite en dev no se ve afectada
- **WHEN** `DATABASE_URL` tiene el formato `sqlite+aiosqlite:///./dev.db`
- **THEN** la app arranca correctamente y los 185 tests pasan

### Requirement: Alembic como único mecanismo de schema en producción
En producción el sistema SHALL rechazar `create_all` automático. El schema MUST gestionarse exclusivamente con `alembic upgrade head`.

#### Scenario: create_all no corre en producción
- **WHEN** `IS_PRODUCTION=true` (o equivalente) está configurado
- **THEN** el lifespan de FastAPI no ejecuta `Base.metadata.create_all`

#### Scenario: Migración pendiente es detectable antes del deploy
- **WHEN** hay una revisión nueva en `alembic/versions/` no aplicada
- **THEN** `alembic current` muestra que la DB está detrás de `head`

## 1. Driver y dependencias

- [x] 1.1 Instalar `asyncpg` en el venv: `pip install asyncpg`
- [x] 1.2 Agregar `asyncpg>=0.29.0` a `requirements.txt` (quitar el comentario que lo bloqueaba)
- [x] 1.3 Verificar que los 185 tests siguen pasando con asyncpg instalado

## 2. Migración inicial limpia

- [x] 2.1 Borrar `alembic/versions/c77bbf9da2cf_add_terms_and_onboarding_to_users.py`
- [x] 2.2 Generar nueva migración: `alembic revision --autogenerate -m "init"`
- [x] 2.3 Revisar el archivo generado — confirmar que crea TODAS las tablas (users, products, sales, clients, cashboxes, cash_sessions, cash_closings, expenses, locations, suppliers, categories, promotions, price_lists, coupons, stock_transfers, returns, activity_logs, categories)
- [x] 2.4 Verificar que `terms_accepted` y `onboarding_completed_at` están incluidos en `users`
- [x] 2.5 Smoke test: `alembic upgrade head` contra SQLite limpio (borrar dev.db, correr upgrade, confirmar 0 errores)
- [x] 2.6 Confirmar que `alembic current` muestra `head` tras el upgrade

## 3. Configuración Neon

- [x] 3.1 Crear proyecto en Neon (neon.tech) si no existe — obtener connection string
- [x] 3.2 Agregar `DATABASE_URL=postgresql+asyncpg://...?sslmode=require` al `.env` de producción (o variable de entorno del hosting)
- [ ] 3.3 Ejecutar `alembic upgrade head` apuntando a Neon — confirmar que las tablas se crean (BLOQUEADO: puerto 5432 bloqueado desde esta red — ejecutar desde hosting o con VPN)
- [ ] 3.4 Ejecutar smoke test: `POST /api/v1/auth/register` + `POST /api/v1/auth/login` contra Neon (pendiente de 3.3)
- [ ] 3.5 Verificar tablas con el cliente de Neon (dashboard o `psql`) (pendiente de 3.3)

## 4. Hardening de producción

- [x] 4.1 Confirmar que `IS_PRODUCTION=true` en el entorno de prod deshabilita `create_all`
- [x] 4.2 Agregar `DATABASE_URL` a `.env.example` con placeholder (sin credenciales reales)
- [x] 4.3 Actualizar `requirements.txt` — remover comentario obsoleto sobre asyncpg y Python 3.14

## 5. Verificación final

- [x] 5.1 Correr los 185 tests completos con SQLite para confirmar sin regresión
- [x] 5.2 Confirmar `alembic history` muestra solo `init` como única revisión

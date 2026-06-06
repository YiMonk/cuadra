# Checklist de Implementación — Cuadra Backend

> Flujo por dominio: spec → test (TDD) → implementación → migrar frontend

---

## Infraestructura base
- [ ] Estructura de carpetas: app/{models,routers,schemas,services}, tests/, alembic/
- [ ] Conexión a Neon (DATABASE_URL en .env, asyncpg)
- [ ] SQLAlchemy async engine + Base
- [ ] Alembic setup (env.py async)
- [ ] Primera migración inicial (`alembic revision --autogenerate -m "init"`)
- [ ] pytest + conftest.py:
  - [ ] Base de datos de prueba en memoria o Neon test branch
  - [ ] `async_client` fixture con TestClient
  - [ ] Fixture `db_session` con rollback automático por test
  - [ ] Fixture `auth_headers(role)` para tests autenticados
- [ ] Health check: GET /api/v1/health → 200

---

## Auth (`specs/auth.md`)
- [ ] Modelo User (id, email, name, password_hash, role, owner_id, active, created_at)
- [ ] POST /api/v1/auth/register (TDD)
- [ ] POST /api/v1/auth/login → JWT 24h + refresh 7d (TDD)
- [ ] POST /api/v1/auth/refresh (TDD)
- [ ] Middleware `get_current_user` (verifica JWT en header)
- [ ] `require_roles(*roles)` dependency factory
- [ ] test_auth.py: registro, login, token expirado, usuario inactivo

---

## Users / Team (`specs/users.md`)
- [ ] GET /api/v1/users/me (TDD)
- [ ] PUT /api/v1/users/me (TDD)
- [ ] POST /api/v1/users/me/change-password (TDD)
- [ ] DELETE /api/v1/users/me (soft delete) (TDD)
- [ ] GET /api/v1/users/team (owner/admin only) (TDD)
- [ ] POST /api/v1/users/team/invite (TDD)
- [ ] PUT /api/v1/users/team/{userId} (TDD)
- [ ] DELETE /api/v1/users/team/{userId} (TDD)
- [ ] test_users.py: perfil, edición, rol insuficiente, invitar, equipo

---

## Products (`specs/products.md`)
- [ ] Modelo Product (id, owner_id, name, price, cost_price, stock, stock_by_location JSONB, variants JSONB, ...)
- [ ] Modelo StockMovement (product_id, adjustment, reason, location_id, ...)
- [ ] GET /api/v1/products (TDD)
- [ ] GET /api/v1/products/{productId} (TDD)
- [ ] POST /api/v1/products (TDD)
- [ ] PATCH /api/v1/products/{productId} (TDD)
- [ ] DELETE /api/v1/products/{productId} (soft delete) (TDD)
- [ ] POST /api/v1/products/{productId}/adjust-stock (TDD — stock negativo bloqueado)
- [ ] POST /api/v1/products/bulk (TDD)
- [ ] test_products.py: CRUD, soft delete, stock negativo, bulk

---

## Sales (`specs/sales.md`)
- [ ] Modelo Sale + SaleItem (todos los campos del tipo TS)
- [ ] POST /api/v1/sales (TDD — descuenta stock atómico, rollback si falla)
- [ ] GET /api/v1/sales (TDD — filtros: status, client, fechas, paginación)
- [ ] GET /api/v1/sales/{saleId} (TDD)
- [ ] PATCH /api/v1/sales/{saleId}/status (TDD)
- [ ] POST /api/v1/sales/{saleId}/cancel (TDD — restaura stock atómico)
- [ ] POST /api/v1/sales/clients/{clientId}/pay-all-debts (TDD)
- [ ] GET /api/v1/sales/daily-summary (TDD)
- [ ] test_sales.py: crear venta, stock insuficiente, cancelar, pagar deudas

---

## Clients (`specs/clients.md`)
- [ ] Modelo Client (id, owner_id, name, phone, email, address, total_debt, active)
- [ ] GET /api/v1/clients (TDD)
- [ ] GET /api/v1/clients/{clientId} (TDD)
- [ ] POST /api/v1/clients (TDD)
- [ ] PATCH /api/v1/clients/{clientId} (TDD)
- [ ] DELETE /api/v1/clients/{clientId} (TDD — bloquea si tiene deudas)
- [ ] Actualización automática de total_debt al crear/cancelar ventas
- [ ] test_clients.py: CRUD, eliminar con deuda pendiente

---

## Cashboxes (`specs/cashboxes.md`)
- [ ] Modelo Cashbox (id, owner_id, name, location_id, assigned_user_id, active)
- [ ] GET /api/v1/cashboxes (TDD)
- [ ] POST /api/v1/cashboxes (TDD)
- [ ] PATCH /api/v1/cashboxes/{cashboxId} (TDD)
- [ ] DELETE /api/v1/cashboxes/{cashboxId} (soft delete) (TDD)
- [ ] GET /api/v1/cashboxes/{cashboxId}/balance (TDD)
- [ ] test_cashboxes.py: CRUD, balance por rango de fechas

---

## Cash Sessions (`specs/cash-sessions.md`)
- [ ] Modelo CashSession (id, owner_id, cashier_id, cashbox_id, status, opened_at, totales...)
- [ ] POST /api/v1/cash-sessions/open (TDD — bloquea doble apertura)
- [ ] GET /api/v1/cash-sessions/current (TDD)
- [ ] GET /api/v1/cash-sessions (TDD)
- [ ] POST /api/v1/cash-sessions/{sessionId}/close (TDD — calcula totales)
- [ ] GET /api/v1/cash-sessions/{sessionId}/report (TDD)
- [ ] GET /api/v1/cash-sessions/{sessionId}/stats (TDD)
- [ ] test_cash_sessions.py: abrir, doble apertura, cerrar, stats

---

## Cash Closings (`specs/cash-closings.md`)
- [ ] Modelo CashClosing (id, owner_id, cashbox_ids, totales, closed_at...)
- [ ] POST /api/v1/cash-closings (TDD — marca ventas con closed_in_closing_id)
- [ ] GET /api/v1/cash-closings (TDD)
- [ ] GET /api/v1/cash-closings/{closingId} (TDD)
- [ ] GET /api/v1/cash-closings/today/last (TDD)
- [ ] test_cash_closings.py: crear, listar, último del día

---

## Expenses (`specs/expenses.md`)
- [ ] Modelo Expense (id, owner_id, description, amount, category, cashbox_id, paid_at, created_by)
- [ ] GET /api/v1/expenses (TDD — filtro por rango)
- [ ] POST /api/v1/expenses (TDD)
- [ ] PATCH /api/v1/expenses/{expenseId} (TDD)
- [ ] DELETE /api/v1/expenses/{expenseId} (TDD)
- [ ] test_expenses.py: CRUD, filtro por fecha, amount <= 0

---

## Locations (`specs/locations.md`)
- [ ] Modelo Location (id, owner_id, name, address, phone, active)
- [ ] GET /api/v1/locations (TDD)
- [ ] POST /api/v1/locations (owner/admin only) (TDD)
- [ ] PATCH /api/v1/locations/{locationId} (TDD)
- [ ] DELETE /api/v1/locations/{locationId} (owner only) (TDD)
- [ ] test_locations.py: CRUD, restricciones de rol

---

## Suppliers (`specs/suppliers.md`)
- [ ] Modelo Supplier (id, owner_id, name, contact_name, phone, email, address, active)
- [ ] GET /api/v1/suppliers (TDD)
- [ ] POST /api/v1/suppliers (TDD)
- [ ] PATCH /api/v1/suppliers/{supplierId} (TDD)
- [ ] DELETE /api/v1/suppliers/{supplierId} (soft delete) (TDD)
- [ ] test_suppliers.py: CRUD

---

## Categories (`specs/categories.md`)
- [ ] Modelo Category (id, owner_id, name, parent_id, color, icon, active)
- [ ] GET /api/v1/categories (TDD)
- [ ] POST /api/v1/categories (TDD — valida parent_id)
- [ ] PATCH /api/v1/categories/{categoryId} (TDD)
- [ ] DELETE /api/v1/categories/{categoryId} (TDD — bloquea si tiene hijos)
- [ ] test_categories.py: CRUD, parent inválido, eliminar con hijos

---

## Promotions, Price Lists & Coupons (`specs/promotions.md`)
- [ ] Modelo Promotion (id, owner_id, name, type, value, applicable_to, starts_at, ends_at, active)
- [ ] Modelo PriceList (id, owner_id, name, items JSONB)
- [ ] Modelo Coupon (id, owner_id, code, discount_type, value, used_count, active)
- [ ] GET /api/v1/promotions (TDD)
- [ ] POST /api/v1/promotions (TDD)
- [ ] PATCH /api/v1/promotions/{id} (TDD)
- [ ] DELETE /api/v1/promotions/{id} (soft delete) (TDD)
- [ ] GET /api/v1/price-lists (TDD)
- [ ] POST /api/v1/price-lists (TDD)
- [ ] PATCH /api/v1/price-lists/{id} (TDD)
- [ ] DELETE /api/v1/price-lists/{id} (TDD)
- [ ] GET /api/v1/coupons (TDD)
- [ ] POST /api/v1/coupons (TDD — normaliza código, verifica unicidad)
- [ ] GET /api/v1/coupons/lookup?code= (TDD)
- [ ] POST /api/v1/coupons/{id}/increment-usage (TDD)
- [ ] PATCH /api/v1/coupons/{id} (TDD)
- [ ] DELETE /api/v1/coupons/{id} (TDD)
- [ ] test_promotions.py: CRUD, código duplicado, lookup

---

## Stock Transfers (`specs/stock-transfers.md`)
- [ ] Modelo StockTransfer (id, owner_id, from_location_id, to_location_id, items JSONB, notes, created_by)
- [ ] POST /api/v1/stock-transfers (TDD — atómico, rollback si stock insuficiente)
- [ ] GET /api/v1/stock-transfers (TDD)
- [ ] GET /api/v1/stock-transfers/{transferId} (TDD)
- [ ] test_stock_transfers.py: crear, mismo origen/destino, stock insuficiente

---

## Returns (`specs/returns.md`)
- [ ] Modelo Return (id, sale_id, owner_id, items JSONB, total_refund, reason, created_by)
- [ ] POST /api/v1/returns (TDD — atómico, restaura stock, marca sale.has_returns)
- [ ] GET /api/v1/sales/{saleId}/returns (TDD)
- [ ] test_returns.py: crear devolución, venta no pagada, cantidad excedida

---

## Activity Log (`specs/activity.md`)
- [ ] Modelo Activity (id, owner_id, user_id, action, entity_type, entity_id, metadata JSONB)
- [ ] Función interna `log_activity(db, owner_id, user, action, ...)` — fire and forget
- [ ] GET /api/v1/activity (owner/admin only) (TDD)
- [ ] Filtro ?user_id= (TDD)
- [ ] test_activity.py: log, listar, rol insuficiente

---

## Reports (`specs/reports.md`)
- [ ] GET /api/v1/reports/sales-summary (TDD — filtro por fechas y location)
- [ ] GET /api/v1/reports/inventory (TDD — low stock, valor total)
- [ ] GET /api/v1/reports/profit (TDD — revenue, expenses, cogs, net)
- [ ] GET /api/v1/reports/by-payment-method (TDD)
- [ ] GET /api/v1/reports/top-products (TDD)
- [ ] GET /api/v1/bcv-rate (sin auth, con caché 30 min) (TDD)
- [ ] test_reports.py: summary, inventory, profit, top productos

---

## Testing y Calidad
- [ ] Coverage mínimo 80% en todos los routers
- [ ] Tests de integración reales (BD de prueba, no mocks)
- [ ] Verificar que owner_id siempre filtra datos (multi-tenant)
- [ ] Smoke tests básicos: login → crear venta → ver reporte

---

## Frontend (después de validar el backend)
- [ ] Crear `src/lib/api.ts` — fetch wrapper con base URL + Bearer token automático
- [ ] Reemplazar AuthContext (Firebase Auth → JWT en localStorage)
- [ ] Reemplazar 18 servicios con llamadas al nuevo backend
- [ ] Convertir onSnapshot a polling con setInterval (30s)
- [ ] Remover SDK de Firebase del proyecto
- [ ] Actualizar middleware.ts (cookie cuadra-session → JWT)

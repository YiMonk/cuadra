# Design: admin-companies

## Schema de tablas nuevas

### `companies`

```sql
CREATE TABLE companies (
    id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    owner_user_id VARCHAR NOT NULL REFERENCES users(id),
    name        VARCHAR NOT NULL,
    rif         VARCHAR,
    plan        VARCHAR NOT NULL DEFAULT 'free',
    modules_enabled TEXT NOT NULL DEFAULT '["operativo"]',  -- JSON array
    subscription_ends_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_companies_owner_user_id ON companies(owner_user_id);
```

`modules_enabled` almacena un array JSON como TEXT (compatible con SQLite dev y PostgreSQL prod sin cambio de tipo). Valores válidos: `"operativo"`, `"finanzas"`.

### `roles`

```sql
CREATE TABLE roles (
    id              VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id      VARCHAR NOT NULL,
    name            VARCHAR NOT NULL,
    permissions     TEXT NOT NULL DEFAULT '{}',  -- JSON: {"operativo":"write","finanzas":"read"}
    is_system_role  BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_roles_company_id ON roles(company_id);
UNIQUE (company_id, name);
```

Los roles de sistema (`cashier`, `viewer`) se crean automáticamente al crear una empresa y tienen `is_system_role = true`. Los permisos de sistema son fijos: `cashier` → `write` en todos los módulos asignados; `viewer` → `read` en todos los módulos asignados. La tabla está preparada para roles custom (fase posterior).

---

## Campos nuevos en `users`

```python
company_id: Optional[str]     # null para owners; UUID de la company para cuentas de acceso
module_access: Optional[str]  # TEXT JSON array, ej. '["operativo"]'; null para owners
```

- Para owners: `company_id = null`, `module_access = null`. El acceso se determina por `companies.modules_enabled`.
- Para cuentas de acceso: `company_id = <uuid de la empresa>`, `module_access = '["modulo1","modulo2"]'`.
- `owner_id` en la tabla `users` no cambia su semántica para cuentas de acceso: `owner_id = company_id` del user (para mantener el filtrado multi-tenancy coherente).

---

## Migración Alembic — estrategia no destructiva

La migración NO toca ninguno de los `owner_id` existentes en las 11 tablas de datos. Los UUIDs de owners siguen siendo válidos como `companies.id`.

### Pasos en orden

1. Crear tabla `companies` con todos sus campos.
2. Crear tabla `roles` con todos sus campos.
3. Poblar `companies`: por cada owner existente (`users WHERE owner_id = id`), insertar una fila con `id = users.id` y `owner_user_id = users.id`. Nombre default: `users.name`. Plan default: `'free'`. `modules_enabled` default: `'["operativo"]'`.
4. Agregar columnas `company_id` (nullable) y `module_access` (nullable TEXT) a la tabla `users`.
5. NO modificar ninguna otra tabla. Los `owner_id` en sale, product, client, expense, cashbox, cash_closing, category, supplier, promotion, location, user siguen siendo los mismos UUIDs.

```sql
-- paso 3
INSERT INTO companies (id, owner_user_id, name, plan, modules_enabled, created_at)
SELECT id, id, name, 'free', '["operativo"]', now()
FROM users
WHERE owner_id = id;

-- paso 4
ALTER TABLE users ADD COLUMN company_id VARCHAR;
ALTER TABLE users ADD COLUMN module_access TEXT;
```

No hay downgrade destructivo: las columnas y tablas nuevas se eliminan al hacer downgrade.

---

## Cambios en JWT

### Nuevo claim `company_id`

El access token incluye un claim opcional `company_id`:

```python
# payload de access token
{
    "sub": "<user_id>",
    "type": "access",
    "cid": "<company_id>"   # ausente si owner con N>1 empresas antes de seleccionar
}
```

El refresh token también incluye `cid` cuando se emite post-selección.

### `create_access_token` extendido

```python
def create_access_token(user_id: str, company_id: str | None = None) -> str
def create_refresh_token(user_id: str, company_id: str | None = None) -> str
```

### `decode_token` extendido

```python
def decode_token(token: str, expected_type: str = "access") -> tuple[str, str | None]:
    # retorna (user_id, company_id_or_None)
```

### Dependencias nuevas en `deps.py`

**`get_current_company(user, token_cid, db) → Company`**
- Si el token tiene `cid`: busca en `companies` por ese id, verifica que la empresa exista y que el user sea owner (`owner_user_id = user.id`) o sea una cuenta de acceso con `company_id = cid`.
- Si el token no tiene `cid` y el user tiene rol `owner`: verifica cuántas empresas tiene; si es 1, la resuelve automáticamente; si es >1 lanza 403 `"company context required"`.
- Si la empresa no existe: lanza 403 `"company not found"`.

**`require_owner(company, user)`**
- Verifica que `user.role == "owner"`. Lanza 403 si no.

**`require_module_access(module: str, action: Literal["read","write"])`**
- Factory que retorna una dependencia FastAPI.
- Si `user.role == "owner"`: verifica que el módulo esté en `company.modules_enabled`. Permite.
- Si `user.role in ("cashier","viewer")`: verifica que el módulo esté en `user.module_access` Y que esté en `company.modules_enabled`.
- Para `action="write"`: si `user.role == "viewer"` lanza 403 `"read-only access"`.
- Si el módulo no está en el acceso del user: lanza 403 `"module access denied"`.

---

## Login flow actualizado

### Owner con 1 empresa

```
POST /auth/login
→ busca user
→ cuenta companies WHERE owner_user_id = user.id
→ count == 1: emite token con cid = company.id
→ responde AuthResponse con access_token (cid incluido)
→ companies[] no se incluye (o vacío)
Frontend: detecta token con cid → navega a /module-select
```

### Owner con N>1 empresas

```
POST /auth/login
→ cuenta companies WHERE owner_user_id = user.id
→ count > 1: emite token SIN cid
→ responde AuthResponse con companies=[{id, name}, ...] en campo adicional
Frontend: detecta token sin cid → navega a /company-select
```

### Owner sin empresa (nuevo registro)

```
POST /auth/login
→ count == 0: emite token SIN cid
→ responde AuthResponse con companies=[]
Frontend: detecta companies vacío → puede navegar a /admin/companies para crear la primera
```

### Cuenta de acceso (cashier/viewer)

```
POST /auth/login
→ user.company_id != null: emite token con cid = user.company_id fijo
Frontend: detecta token con cid → navega a /module-select directamente
```

### `POST /auth/select-company`

```python
# Request
{ "company_id": "<uuid>" }

# Lógica
→ verifica company.owner_user_id == user.id (403 si no coincide)
→ emite nuevo access_token + refresh_token con cid = company_id
→ responde con AuthResponse
```

---

## Endpoints nuevos

### Companies (`/api/v1/companies`)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/v1/companies` | owner | Crear empresa |
| GET | `/api/v1/companies` | owner | Listar empresas propias |
| GET | `/api/v1/companies/{companyId}` | owner | Obtener empresa por id |
| PATCH | `/api/v1/companies/{companyId}` | owner | Actualizar empresa |
| DELETE | `/api/v1/companies/{companyId}` | - | 405 siempre |

### Access Accounts (`/api/v1/companies/{companyId}/access-accounts`)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/v1/companies/{companyId}/access-accounts` | owner | Crear cuenta de acceso |
| GET | `/api/v1/companies/{companyId}/access-accounts` | owner | Listar cuentas de acceso |
| PATCH | `/api/v1/companies/{companyId}/access-accounts/{accountId}` | owner | Actualizar cuenta (name, role, module_access) |
| PATCH | `/api/v1/companies/{companyId}/access-accounts/{accountId}/password` | owner | Cambiar password sin requerir el actual |
| PATCH | `/api/v1/companies/{companyId}/access-accounts/{accountId}/status` | owner | Activar/desactivar cuenta |

### Company Locations (`/api/v1/companies/{companyId}/locations`)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/companies/{companyId}/locations` | owner | Listar sucursales de la empresa |
| POST | `/api/v1/companies/{companyId}/locations` | owner | Crear sucursal |
| PATCH | `/api/v1/companies/{companyId}/locations/{locationId}` | owner | Actualizar sucursal |
| DELETE | `/api/v1/companies/{companyId}/locations/{locationId}` | owner | Desactivar sucursal (soft delete) |

El endpoint legacy `GET /api/v1/locations` continúa funcionando, filtrando por `owner_id = company_id del JWT`.

### Auth extendido

| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/select-company` | Emitir JWT con company_id seleccionado |

---

## Schemas Pydantic nuevos

```python
# CompanyCreate
name: str (min_length=1)
rif: str | None = None
modules_enabled: list[str] (min_length=1)

# CompanyUpdate (todos opcionales)
name: str | None
rif: str | None
modules_enabled: list[str] | None (min_length=1 si se envía)
plan: str | None

# CompanyOut
id, owner_user_id, name, rif, plan, modules_enabled: list[str], subscription_ends_at, created_at

# CompanySummary (para lista en login)
id, name

# AccessAccountCreate
email: str
password: str (min_length=8)
name: str
role: Literal["cashier","viewer"]
module_access: list[str] (min_length=1)

# AccessAccountUpdate (todos opcionales)
name: str | None
role: Literal["cashier","viewer"] | None
module_access: list[str] | None (min_length=1 si se envía)

# AccessAccountPasswordUpdate
new_password: str (min_length=8)

# AccessAccountStatusUpdate
active: bool

# AccessAccountOut
id, email, name, role, module_access: list[str], active, company_id

# SelectCompanyRequest
company_id: str

# AuthResponse (extendido)
# campo adicional:
companies: list[CompanySummary] | None = None
```

---

## Capa de servicios

### `company_service.py`

Lógica de negocio para CRUD de empresas, validación de ownership, serialización de `modules_enabled` JSON.

### `access_account_service.py`

Lógica para crear/actualizar cuentas de acceso, hash de password con bcrypt cost 12, validación de roles permitidos (`cashier`, `viewer`), serialización de `module_access` JSON.

---

## Frontend — cambios en AuthContext

`AuthContext` pasa a leer `company_id` del JWT decodificado en cliente para determinar el flujo de redirección. No requiere llamada adicional al backend: el JWT ya contiene `cid`.

```typescript
// Lógica de redirección post-login en AuthContext o middleware
const cid = decodeJwtCompanyId(access_token); // lee claim "cid"
if (!cid) {
  // ir a /company-select
} else {
  // ir a /module-select
}
```

### `useActiveCompany` hook

```typescript
// Frontend/src/hooks/useActiveCompany.ts
const COMPANY_KEY = 'cuadra_active_company';

interface ActiveCompany {
  id: string;
  name: string;
}

export function useActiveCompany(): {
  activeCompany: ActiveCompany | null;
  setActiveCompany: (c: ActiveCompany) => void;
  clearActiveCompany: () => void;
}
```

Persiste en `localStorage` con clave `cuadra_active_company` como JSON. Se actualiza al completar `/company-select`.

### Pantalla `/company-select`

- Muestra la lista de empresas del owner (recibida en la respuesta de login o consultada vía `GET /api/v1/companies`).
- Al seleccionar: `POST /api/v1/auth/select-company` → guarda nuevos tokens con `AuthTokens.set()` → guarda empresa activa con `useActiveCompany` → navega a `/module-select`.
- Guard: si el JWT ya tiene `cid` al montar la página, redirige directamente a `/module-select`.

### Sección gestión de empresas en admin

Nueva ruta: `/admin/companies`

Vistas:
- Lista de empresas del owner con nombre, plan y módulos activos.
- Formulario crear/editar empresa.
- Por empresa: lista de sucursales (CRUD).
- Por empresa: lista de cuentas de acceso (CRUD + cambio de password + activar/desactivar).

### Control de acceso en frontend

```typescript
// usePermission.ts (extender hook existente)
// Agregar:
canWrite(module: string): boolean  // false si role === "viewer" o módulo no asignado
canAccess(module: string): boolean // false si módulo no en module_access del user
```

Los botones de acción (crear venta, crear producto, etc.) se ocultan o deshabilitan según `canWrite`.

---

## Consideraciones de seguridad

- El `company_id` del JWT se usa como fuente de verdad en el backend; nunca se confía en un `company_id` enviado en el body para determinar ownership.
- Las cuentas de acceso no pueden auto-modificar su `role` ni `module_access`; solo el owner puede.
- El endpoint de cambio de password de cuentas de acceso no requiere la contraseña actual de la cuenta: el owner es la autoridad. Sí requiere que el caller sea owner con `company_id` coincidente.
- Los tokens de una cuenta desactivada (`active=false`) son rechazados en el próximo request gracias a la verificación `User.active == True` en `get_current_user`.

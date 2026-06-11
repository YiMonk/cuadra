## Why

Hoy la plataforma trata al usuario registrado directamente como la "empresa" — su `id` es el `owner_id` de todos los datos. Esto impide que un mismo usuario maneje múltiples negocios de forma separada y que pueda delegar accesos controlados a colaboradores externos (contadores, supervisores) sin darles acceso total al sistema.

## What Changes

- Se introduce la entidad `Company` como capa de tenancy real entre el usuario y sus datos.
- Un usuario puede crear y gestionar múltiples empresas. Cada empresa tiene sus propias sucursales.
- El dueño puede crear **cuentas de acceso** (credenciales email+password) por empresa, asignando un rol predefinido y los módulos específicos que puede ver o usar.
- Los roles predefinidos iniciales son `cashier` (puede actuar) y `viewer` (solo lectura).
- La tabla `roles` se diseña para soportar roles custom con `permissions` JSON por módulo — la UI de creación de roles custom queda para una fase posterior.
- El flujo de login detecta si el usuario tiene múltiples empresas y presenta un selector antes de entrar al app.

## Capabilities

### New Capabilities
- `companies`: CRUD de empresas por usuario, incluyendo nombre, RIF, plan y módulos activos.
- `company-locations`: gestión de sucursales dentro del contexto de una empresa.
- `access-accounts`: creación y administración de cuentas de acceso por empresa — email, contraseña (modificable por el dueño), rol y módulos asignados explícitamente.
- `module-access-control`: middleware que valida, por cada request, si el usuario tiene acceso al módulo que intenta usar, y si puede actuar o solo leer.
- `company-select-flow`: flujo de selección de empresa en login cuando el usuario tiene más de una.

### Modified Capabilities
- `users`: el campo `owner_id` pasa a referenciar `companies.id` en vez de `users.id`. Los usuarios dueños tienen `company_id` en su JWT al seleccionar empresa.
- `locations`: `owner_id` sigue igual pero ahora apunta a `companies.id`.

## Impact

**Backend:**
- Nueva tabla `companies`: `id, owner_user_id, name, rif, plan, modules_enabled[], subscription_ends_at, created_at`
- Nueva tabla `roles`: `id, company_id, name, permissions JSON, is_system_role bool`
- Modificación de `User`: añadir `company_id` FK, `module_access[]`, reemplazar lógica de `owner_id = user.id` en registro
- Migración Alembic: crear companies a partir de owners existentes, actualizar `owner_id` en todos los modelos (11 tablas)
- Nuevo dep `get_current_company` para validar contexto de empresa en JWT
- Endpoints nuevos: `/api/v1/companies`, `/api/v1/companies/{id}/access-accounts`

**Frontend:**
- Pantalla `company-select` (antes de `module-select` cuando hay múltiples empresas)
- Sección "Gestión" en panel admin: empresas, sucursales, cuentas de acceso
- Hook `useActiveCompany` para contexto de empresa activa
- `module-access-control` en frontend: ocultar acciones si el usuario es `viewer`

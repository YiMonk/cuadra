# Tasks: admin-companies

## Backend — Modelos nuevos

- [x] **T0- [x] **T01** Crear `Backend/app/models/company.py` con campos: `id` (UUID str PK), `owner_user_id` (str FK→users.id), `name` (str NOT NULL), `rif` (str nullable), `plan` (str default `'free'`), `modules_enabled` (Text JSON, default `'["operativo"]'`), `subscription_ends_at` (DateTime nullable), `created_at` (DateTime). Índice en `owner_user_id`.

- [x] **T0- [x] **T02** Crear `Backend/app/models/role.py` con campos: `id` (UUID str PK), `company_id` (str NOT NULL, índice), `name` (str NOT NULL), `permissions` (Text JSON, default `'{}'`), `is_system_role` (bool default False), `created_at` (DateTime). Restricción UNIQUE en `(company_id, name)`.

- [x] **T0- [x] **T03** Modificar `Backend/app/models/user.py`: añadir `company_id: Optional[str]` (nullable) y `module_access: Optional[str]` (Text nullable). Registrar los modelos nuevos en `Backend/app/models/__init__.py`.

## Backend — Migración Alembic

- [x] **T0- [x] **T04** Crear migración Alembic `Backend/alembic/versions/<rev>_admin_companies.py`:
  1. Crear tabla `companies`.
  2. Crear tabla `roles`.
  3. `INSERT INTO companies SELECT id, id, name, 'free', '["operativo"]', now() FROM users WHERE owner_id = id`.
  4. `ALTER TABLE users ADD COLUMN company_id VARCHAR`.
  5. `ALTER TABLE users ADD COLUMN module_access TEXT`.
  Downgrade elimina las columnas y tablas en orden inverso.

## Backend — Auth (JWT + select-company + nuevos deps)

- [x] **T0- [x] **T05** Modificar `Backend/app/services/auth_service.py`: extender `create_access_token(user_id, company_id=None)` y `create_refresh_token(user_id, company_id=None)` para incluir claim `"cid"`. Extender `decode_token()` para devolver `(user_id, company_id | None)`.

- [x] **T06** Modificar `Backend/app/routers/auth.py` — endpoint `POST /login`: después de validar credenciales, contar `companies WHERE owner_user_id = user.id`; si count == 1 emitir token con `cid`; si count > 1 emitir token sin `cid` e incluir `companies: list[CompanySummary]` en la respuesta; cuentas de acceso (`user.company_id != null`) siempre emiten token con `cid = user.company_id`.

- [x] **T07** Modificar `Backend/app/routers/auth.py` — endpoint `POST /register`: después de crear la primera empresa implícita (en esta fase el registro no crea empresa automáticamente — el owner crea su empresa manualmente) emitir token sin `cid`. Actualizar `AuthResponse` para incluir campo opcional `companies`.

- [x] **T08** Agregar endpoint `POST /api/v1/auth/select-company` en `Backend/app/routers/auth.py`: recibe `SelectCompanyRequest(company_id: str)`, verifica `company.owner_user_id == user.id` (403 si no), emite nuevo access + refresh token con `cid`, devuelve `AuthResponse`.

- [x] **T09** Modificar `Backend/app/deps.py`: actualizar `get_current_user` para trabajar con el nuevo `decode_token` que devuelve tupla; exponer `company_id` del JWT como atributo del request state o vía dependencia separada `get_jwt_company_id`. Agregar `get_current_company(user, jwt_company_id, db) → Company` que resuelve la empresa del contexto (lanza 403 si no hay `cid` y el owner tiene >1 empresa). Agregar `require_owner` que verifica `user.role == "owner"`. Agregar factory `require_module_access(module: str, action: str)` que valida `modules_enabled` de la empresa y `module_access` del user.

## Backend — Schemas Pydantic

- [x] **T10** Crear `Backend/app/schemas/company.py` con: `CompanyCreate`, `CompanyUpdate`, `CompanyOut`, `CompanySummary`. Actualizar `Backend/app/schemas/auth.py` para añadir `companies: list[CompanySummary] | None = None` en `AuthResponse` y agregar `SelectCompanyRequest`.

- [x] **T11** Crear `Backend/app/schemas/access_account.py` con: `AccessAccountCreate`, `AccessAccountUpdate`, `AccessAccountPasswordUpdate`, `AccessAccountStatusUpdate`, `AccessAccountOut`.

## Backend — Router companies

- [x] **T12** Crear `Backend/app/services/company_service.py` con funciones: `create_company`, `get_companies_by_owner`, `get_company_by_id`, `update_company`. Todas manejan serialización/deserialización de `modules_enabled` JSON y validan que la lista no sea vacía.

- [x] **T13** Crear `Backend/app/routers/companies.py` con endpoints: `POST /api/v1/companies`, `GET /api/v1/companies`, `GET /api/v1/companies/{companyId}`, `PATCH /api/v1/companies/{companyId}`, `DELETE /api/v1/companies/{companyId}` (retorna 405). Todos usan `require_owner`. Registrar el router en `Backend/app/main.py`.

## Backend — Router access-accounts

- [x] **T1- [x] **T14** Crear `Backend/app/services/access_account_service.py` con funciones: `create_access_account` (hash bcrypt cost 12, owner_id = company_id, valida role in cashier/viewer, valida module_access no vacío), `list_access_accounts`, `update_access_account`, `set_account_password`, `set_account_status`.

- [x] **T1- [x] **T15** Crear `Backend/app/routers/access_accounts.py` con endpoints: `POST /api/v1/companies/{companyId}/access-accounts`, `GET /api/v1/companies/{companyId}/access-accounts`, `PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}`, `PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}/password`, `PATCH /api/v1/companies/{companyId}/access-accounts/{accountId}/status`. Registrar en `Backend/app/main.py`.

## Backend — Router company-locations

- [x] **T1- [x] **T16** Agregar endpoints de sucursales bajo el namespace de empresa en `Backend/app/routers/company_locations.py`: `GET /api/v1/companies/{companyId}/locations`, `POST /api/v1/companies/{companyId}/locations`, `PATCH /api/v1/companies/{companyId}/locations/{locationId}`, `DELETE /api/v1/companies/{companyId}/locations/{locationId}` (soft delete, active=false). Reutilizar modelo `Location` existente. Registrar en `main.py`.

## Backend — Tests

- [x] **T1- [x] **T17** Crear `Backend/tests/test_companies.py`: tests AAA para crear empresa (201, 422 sin name, 422 modules vacío, 403 cashier), listar (200 solo propias, vacío), obtener por id (200, 404 otro owner), actualizar (200, 404, 422 modules vacío), DELETE (405).

- [x] **T1- [x] **T18** Crear `Backend/tests/test_access_accounts.py`: tests para crear cuenta (201, 409 email duplicado, 422 module vacío, 422 role inválido, 422 password corto, 403 company mismatch), listar (200), actualizar (200, 404, 422 module vacío), cambiar password (200, 422, 404, 403), activar/desactivar (200, 403). Login de cuenta de acceso (200 con cid en token, 401 desactivada).

- [x] **T1- [x] **T19** Crear `Backend/tests/test_auth_company.py`: tests para login 1 empresa (token con cid), login N empresas (token sin cid + companies[]), select-company (200 nuevo token, 403 empresa ajena), require_module_access (200 owner, 403 módulo no asignado, 403 viewer en write, 403 sin company_id en JWT).

- [x] **T20 Crear `Backend/tests/test_company_locations.py`: tests para CRUD de sucursales bajo `/companies/{companyId}/locations` (201, 200, 404, 403 empresa ajena, 403 cashier, 204 desactivar).

## Frontend — Auth context y hooks

- [x] **T21** Crear `Frontend/src/lib/jwt-decode.ts`: helper `decodeJwtPayload(token: string): { sub: string; cid?: string; type: string } | null` que decodifica el payload base64 del JWT sin verificar firma (solo cliente, la verificación es del backend).

- [x] **T22** Modificar `Frontend/src/context/AuthContext.tsx`: usar `decodeJwtPayload` para leer `cid` del access token al iniciar sesión. Exponer `companyId: string | null` en `AuthContextType`. Agregar lógica de redirección: si `cid` presente → no ir a `/company-select`; si ausente y user autenticado → ir a `/company-select`.

- [x] **T23** Crear `Frontend/src/hooks/useActiveCompany.ts`: hook con `activeCompany: { id: string; name: string } | null`, `setActiveCompany`, `clearActiveCompany`. Persiste en `localStorage` con clave `cuadra_active_company` como JSON.

- [x] **T24** Modificar `Frontend/src/hooks/usePermission.ts` (o crearlo si no existe): agregar `canWrite(module: string): boolean` (false si `role === "viewer"` o módulo no en `module_access`) y `canAccess(module: string): boolean`.

- [x] **T25** Crear `Frontend/src/services/companyService.ts`: funciones `getCompanies()`, `getCompany(id)`, `createCompany(data)`, `updateCompany(id, data)`, `selectCompany(companyId)` (llama a `POST /auth/select-company`, guarda tokens y empresa activa), `getAccessAccounts(companyId)`, `createAccessAccount(companyId, data)`, `updateAccessAccount(companyId, accountId, data)`, `setAccountPassword(companyId, accountId, newPassword)`, `setAccountStatus(companyId, accountId, active)`.

## Frontend — Pantalla company-select

- [x] **T26** Crear `Frontend/src/app/company-select/page.tsx`: lista empresas (del state de login o vía `GET /api/v1/companies`). Al seleccionar: llama `selectCompany(id)` del servicio, guarda empresa activa, redirige a `/module-select`. Guard: si JWT ya tiene `cid` al montar, redirige directamente a `/module-select`. Si lista vacía, muestra CTA para crear la primera empresa.

## Frontend — Sección gestión de empresas en admin

- [x] **T27** Crear `Frontend/src/app/admin/companies/page.tsx`: lista de empresas del owner (nombre, RIF, plan, módulos activos). Botón crear empresa.

- [x] **T28** Crear `Frontend/src/app/admin/companies/[companyId]/page.tsx`: detalle de empresa con formulario editar (nombre, RIF, modules_enabled). Sección de sucursales con lista + botón agregar + editar + desactivar. Sub-sección cuentas de acceso (enlace a su propia vista).

- [x] **T29** Crear `Frontend/src/components/admin/CompanyForm.tsx`: formulario reutilizable para crear/editar empresa. Campos: nombre (requerido), RIF (opcional), módulos habilitados (checkboxes: operativo, finanzas). Validación inline: nombre no vacío, al menos un módulo seleccionado.

## Frontend — Sección cuentas de acceso en admin

- [x] **T30** Crear `Frontend/src/app/admin/companies/[companyId]/access-accounts/page.tsx`: tabla de cuentas de acceso con columnas nombre, email, rol, módulos, estado activo. Acciones: editar, cambiar password, activar/desactivar.

- [x] **T31** Crear `Frontend/src/components/admin/AccessAccountForm.tsx`: formulario crear/editar cuenta. Campos: nombre, email, contraseña (solo en creación), rol (cashier/viewer via select), módulos asignados (checkboxes). Validación: email válido, password min 8 chars, al menos un módulo, rol válido.

- [x] **T32** Crear `Frontend/src/components/admin/ChangePasswordModal.tsx`: modal para que el owner cambie el password de una cuenta de acceso. Solo requiere `new_password` (min 8 chars). No pide password actual.

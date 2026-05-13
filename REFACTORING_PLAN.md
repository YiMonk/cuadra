# Plan de Optimización y Refactoring — Cuadra

> Generado el 2026-05-11 con análisis de grafo de conocimiento (385 nodos · 802 aristas · 37 comunidades)

---

## Índice

1. [Problemas detectados](#problemas-detectados)
2. [Plan paso a paso](#plan-paso-a-paso)
3. [Camino de useAuth()](#camino-de-useauth)
4. [Checklist de inicio](#checklist-de-inicio)

---

## Problemas detectados

### Crítico — afecta rendimiento o correctitud en producción

| # | Problema | Archivo | Línea | Impacto |
|---|---------|---------|-------|---------|
| C1 | `setInterval(2000)` en vez de `onSnapshot` | `cashClosing.service.ts` | 50 | Memory leak + 30 llamadas/min innecesarias a Firestore |
| C2 | `getAllSales()` carga hasta 500 docs sin paginación real | `sales.service.ts` | 206 | RAM excesiva + costos Firestore en producción |
| C3 | `getUsers()` sin límite ni paginación | `user.service.ts` | 66 | Carga todos los usuarios en cada llamada |
| C4 | Firebase Auth directamente en componente UI | `admin/users/page.tsx` | 12–14 | Imposible testear, mezcla de capas |
| C5 | `uploadBytes`/`getDownloadURL` directamente en POS | `pos/page.tsx` | 13–14 | Sin manejo de errores centralizado |
| C6 | `getSalesForClosing()` llama a `getAllSales()` completo | `cashClosing.service.ts` | — | Carga masiva para calcular un solo cierre |

---

### Alto — deuda técnica clara

| # | Problema | Archivo | Línea | Impacto |
|---|---------|---------|-------|---------|
| A1 | 11 usos de `as any` distribuidos | Varios | Varios | TypeScript no protege, bugs silenciosos |
| A2 | Propiedad `location` en Product sin definir en tipo | `pos/page.tsx`, `inventory/page.tsx` | 210, 143 | Propiedad fantasma no documentada |
| A3 | Validación de suscripción dentro de `AuthContext` | `AuthContext.tsx` | 57–86 | Lógica de negocio en capa de contexto UI |
| A4 | `signIn()` declarado pero vacío | `AuthContext.tsx` | 165 | Dead code confuso |
| A5 | `useEffect` con 5 responsabilidades distintas | `pos/page.tsx` | 61–177 | Imposible debuggear, re-renders innecesarios |
| A6 | Filtrado de productos por ubicación en componente | `pos/page.tsx` | 203–214 | Lógica de negocio en capa UI |
| A7 | Cálculo de métricas de reporte duplicado en componente | `reports/page.tsx` | 124–146 | Duplicado con `computeSummary` del servicio |
| A8 | `useState<any[]>` en lista de clientes | `clients/page.tsx` | 17 | Tipo incompleto |
| A9 | POS importa 5 servicios directamente | `pos/page.tsx` | 8–12 | Acoplamiento fuerte, difícil de testear |

---

### Medio — mejoras de arquitectura

| # | Problema | Archivo | Impacto |
|---|---------|---------|---------|
| M1 | Sin custom hooks para suscripciones de datos | Páginas en general | Patrón subscribe/unsubscribe duplicado en cada página |
| M2 | `useAuth()` importado en 14 páginas + 5 componentes | 19 archivos | Si cambia la interfaz, impacta todo el proyecto |
| M3 | Sin capa de error handling centralizada | Servicios | Cada página maneja errores de forma distinta |
| M4 | `ownerId` se recalcula con `user?.ownerId ?? user?.uid` en cada página | Múltiples páginas | Lógica repetida en cada componente |
| M5 | Sin índices de Firestore documentados en código | `cashbox.service.ts`, `sales.service.ts` | Queries pueden fallar en producción sin aviso claro |
| M6 | `stampLegacyDocuments()` sin feedback de progreso | `migration.service.ts` | Si falla a la mitad, no hay forma de saber dónde |
| M7 | `wipeDatabase()` sin confirmación de seguridad a nivel de código | `admin/` | Riesgo de borrado accidental |

---

## Plan paso a paso

### Fase 1 — Apagar los fuegos
> Estimado: 1–2 días. Estos problemas generan costos reales o bugs en producción ahora mismo.

#### Paso 1.1 — Reemplazar polling por `onSnapshot` en CashClosingService

**Archivo:** `src/services/cashClosing.service.ts:35–53`

```typescript
// ANTES (problemático):
const intervalId = setInterval(loadClosings, 2000)
return () => clearInterval(intervalId)

// DESPUÉS:
const q = query(collection(db, 'cashClosings'), where('ownerId', '==', ownerId))
return onSnapshot(q, (snap) => {
  callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as CashClosing)))
})
```

Elimina 30 lecturas/min de Firestore y el riesgo de memory leak.

---

#### Paso 1.2 — Limitar `getAllSales()` por defecto

**Archivo:** `src/services/sales.service.ts:206`

```typescript
// ANTES:
pageSize ?? 500

// DESPUÉS:
pageSize ?? 50
```

Agregar además un método `getAllSalesUnlimited()` explícito para los casos que lo requieran, con un comentario de advertencia.

---

#### Paso 1.3 — Agregar paginación a `getUsers()`

**Archivo:** `src/services/user.service.ts:66–75`

Agregar `limit(100)` como mínimo y exponer `getUsersPaginated(lastDoc?)` con cursor para la pantalla de administración.

---

### Fase 2 — Extraer servicios faltantes
> Estimado: 2–3 días. Crear las capas de abstracción que faltan.

#### Paso 2.1 — Crear `StorageService`

**Nuevo archivo:** `src/services/storage.service.ts`

```typescript
export const StorageService = {
  async uploadSaleEvidence(file: File, saleId: string): Promise<string> {
    const ref = storageRef(storage, `evidence/${saleId}/${file.name}`)
    await uploadBytes(ref, file)
    return getDownloadURL(ref)
  }
}
```

Mover las importaciones de `firebase/storage` fuera de `pos/page.tsx:13–14`.

---

#### Paso 2.2 — Crear `AuthManagementService`

**Nuevo archivo:** `src/services/authManagement.service.ts`

```typescript
export const AuthManagementService = {
  async createUser(email: string, password: string, role: UserRole, ownerId: string): Promise<UserProfile>
  async deleteUser(uid: string): Promise<void>
}
```

Mover `createUserWithEmailAndPassword` fuera de `admin/users/page.tsx:12–14`.

---

#### Paso 2.3 — Extraer validación de suscripción de `AuthContext`

**Archivo:** `src/context/AuthContext.tsx:57–86`

```typescript
// Nuevo: src/services/subscription.service.ts
export const SubscriptionService = {
  validate(user: UserProfile): { valid: boolean; reason?: 'expired' | 'inactive' }
}
```

`AuthContext` solo llama a `SubscriptionService.validate(user)` y reacciona al resultado.

---

### Fase 3 — Tipar el código
> Estimado: 1–2 días. Eliminar todos los `any` y propiedades fantasma.

#### Paso 3.1 — Agregar `location` al tipo `Product`

**Archivo:** `src/types/` — agregar campo al tipo `Product`:

```typescript
interface Product {
  // ... campos existentes
  location?: string  // referencia a LocationId, opcional
}
```

Elimina los casteos `as any` en `pos/page.tsx:210` y `inventory/page.tsx:143`.

---

#### Paso 3.2 — Tipar internals de `SalesService`

**Archivo:** `src/services/sales.service.ts:26–27`

```typescript
// ANTES:
type InventoryUpdate = { ref: ReturnType<typeof doc>; data: Record<string, unknown> }

// DESPUÉS:
type InventoryUpdate = { ref: DocumentReference; data: Partial<Product> }
type MovementLog     = { ref: DocumentReference; data: StockMovement }
```

Elimina los 4 casteos `as any` en líneas 106, 109, 415, 418.

---

#### Paso 3.3 — Tipar estado de clientes

**Archivo:** `src/app/clients/page.tsx:17`

```typescript
// ANTES:
const [clients, setClients] = useState<any[]>([])

// DESPUÉS:
const [clients, setClients] = useState<Client[]>([])
```

---

#### Paso 3.4 — Tipar `firebaseUser` en AuthContext

**Archivo:** `src/context/AuthContext.tsx:30`

```typescript
// ANTES:
async (firebaseUser: any) => {

// DESPUÉS:
async (firebaseUser: FirebaseUser | null) => {
```

---

### Fase 4 — Descomponer el POS
> Estimado: 3–4 días. La página más compleja del proyecto (5 servicios, 5 useEffects anidados).

#### Paso 4.1 — Crear hook `usePOSData()`

**Nuevo archivo:** `src/hooks/usePOSData.ts`

```typescript
export function usePOSData(ownerId: string) {
  // Extrae: las 5 suscripciones de pos/page.tsx:61-177
  return { products, clients, locations, cashboxes, isLoading }
}
```

---

#### Paso 4.2 — Mover filtrado de productos al servicio

**Archivo:** `src/app/pos/page.tsx:203–214`

```typescript
// Mover a ProductService:
getByLocation(products: Product[], locationId: string): Product[]
```

---

#### Paso 4.3 — Crear hook `useOwnerContext()`

**Nuevo archivo:** `src/hooks/useOwnerContext.ts`

```typescript
export function useOwnerContext() {
  const { user } = useAuth()
  const ownerId = user?.ownerId ?? user?.uid ?? ''
  return { ownerId, user }
}
```

Reemplazar la lógica `user?.ownerId ?? user?.uid` que se repite en todas las páginas.

---

### Fase 5 — Custom hooks de datos
> Estimado: 2–3 días. Eliminar el patrón subscribe/unsubscribe duplicado.

Crear los siguientes hooks reutilizables, cada uno con su propio cleanup y estado de loading:

| Hook nuevo | Reemplaza |
|-----------|-----------|
| `src/hooks/useSales.ts` | `SalesService.subscribeToPendingSales` inline |
| `src/hooks/useCashboxes.ts` | `CashboxService.subscribeToCashboxes` inline |
| `src/hooks/useInventory.ts` | `ProductService.subscribeToProducts` inline |
| `src/hooks/useClients.ts` | `ClientService.subscribeToClients` inline |
| `src/hooks/useClosings.ts` | Reemplaza el polling de `subscribeToClosings` |
| `src/hooks/useTeam.ts` | `UserService.subscribeToTeam` inline |

Estructura estándar para cada hook:

```typescript
export function useCashboxes(ownerId: string) {
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!ownerId) return
    const unsub = CashboxService.subscribeToCashboxes(ownerId, (data) => {
      setCashboxes(data)
      setIsLoading(false)
    })
    return unsub
  }, [ownerId])

  return { cashboxes, isLoading }
}
```

---

### Fase 6 — Centralizar error handling
> Estimado: 1–2 días.

#### Paso 6.1 — Crear `ServiceError` tipado

**Nuevo archivo:** `src/lib/errors.ts`

```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: 'not-found' | 'permission-denied' | 'unavailable' | 'unknown',
    public context?: Record<string, unknown>
  ) {
    super(message)
  }
}
```

Todos los servicios capturan errores de Firestore y lanzan `ServiceError` con código y contexto.

---

#### Paso 6.2 — Hook `useServiceCall()`

**Nuevo archivo:** `src/hooks/useServiceCall.ts`

```typescript
export function useServiceCall<T>(fn: () => Promise<T>) {
  // Devuelve: { execute, data, isLoading, error }
  // Maneja: loading state, ServiceError tipado, retry
}
```

---

### Fase 7 — Dividir `useAuth()` (largo plazo)
> Estimado: 3–5 días. Ver sección completa abajo.

Dividir en hooks más pequeños manteniendo `useAuth()` como alias para no romper nada existente:

```typescript
// Nuevos hooks enfocados:
useSession()     → { user, isLoading, isAuthenticated }
useRole()        → { role, isOwner, isAdmin, isStaff }
useAuthActions() → { signIn, signOut, reloadUser }

// useAuth() queda como:
export function useAuth() {
  return { ...useSession(), ...useRole(), ...useAuthActions() }
}
```

Migrar archivo por archivo usando los hooks pequeños en código nuevo.

---

## Camino de useAuth()

`useAuth()` tiene **43 conexiones** — es el nodo con mayor betweenness centrality (0.048) del proyecto. Actúa como puente entre 5 comunidades distintas.

```
useAuth()
│
├── 14 páginas (todas las rutas protegidas)
│   ├── Home, POSScreen, InventoryScreen, ReportsScreen
│   ├── ClientListScreen, ClientProfileScreen
│   ├── CashSessionsPage, CollectionsScreen
│   ├── SettingsScreen, AdministrationScreen, MenuPage
│   └── AdminGodDashboardPage, AdminUserManagementPage, UserDetailPage
│
├── 5 componentes internos
│   ├── AppLayout       → muestra menú según rol
│   ├── SalePaymentModal → verifica rol para autorizar descuentos
│   ├── CategoryModal   → usa ownerId para crear categorías
│   ├── MovementHistory → filtra historial por ownerId
│   └── UpdateDetector  → verifica updates según rol
│
└── Fuente de datos
    ├── AuthContext.tsx
    └── types/auth.ts → UserProfile, AuthState
```

### Por qué es un problema

`useAuth()` actualmente mezcla **3 responsabilidades**:

```typescript
// 1. Estado de sesión (cambia en login/logout)
{ user, isLoading, isAuthenticated }

// 2. Datos del perfil (podrían venir de Firestore, no solo de JWT)
user.role, user.ownerId, user.subscriptionEndsAt, user.termsAccepted

// 3. Acciones (funciones estables que no deberían causar re-renders)
{ signIn, signOut, reloadUser }
```

**Consecuencias actuales:**
- Una página que solo necesita `ownerId` para filtrar datos re-renderiza completa cuando cambia `isLoading`
- Si cambias cómo se obtiene el rol (JWT → Firestore), tocas 19 archivos
- Si agregas un campo a `UserProfile`, todos los consumidores de `useAuth()` reciben el cambio aunque no lo usen

### Solución concreta

```typescript
// ANTES — en 19 archivos con lógica repetida:
const { user } = useAuth()
const ownerId = user?.ownerId ?? user?.uid

// DESPUÉS — con hooks enfocados:
const { ownerId } = useOwnerContext()  // no re-renderiza por isLoading
const { role }    = useRole()          // solo cambia si cambia el rol
const { signOut } = useAuthActions()   // función estable, nunca re-renderiza
```

---

## Checklist de inicio

Copia esta sección a tu gestor de tareas o úsala directamente.

### Fase 1 — Crítico (hacer primero)

- [x] **C1** — Reemplazar `setInterval(2000)` por `onSnapshot` en `cashClosing.service.ts:50`
- [x] **C2** — Cambiar `pageSize ?? 500` a `pageSize ?? 50` en `sales.service.ts:206`
- [x] **C3** — Agregar `limit(200)` a `getUsers()` en `user.service.ts:66`
- [x] **C4** — Crear `src/services/authManagement.service.ts` y mover lógica de `admin/users/page.tsx:12-14`
- [x] **C5** — Crear `src/services/storage.service.ts` y mover lógica de `pos/page.tsx:13-14`
- [x] **C6** — Refactorizar `getSalesForClosing()` para consultar Firestore directo por rango de fechas

### Fase 2 — Servicios faltantes

- [x] **2.1** — Crear `StorageService` con método `uploadSaleEvidence(file, saleId)`
- [x] **2.2** — Crear `AuthManagementService` con `createUser()` y `deleteUser()`
- [x] **2.3** — Crear `SubscriptionService.checkAccess()` y extraerlo de `AuthContext.tsx:57-86`

### Fase 3 — Tipos

- [x] **3.1** — `location?: string` ya estaba en el tipo `Product` — no requería cambio
- [x] **3.2** — Tipar `InventoryUpdate` y `MovementLog` con `DocumentReference` en `sales.service.ts` y `return.service.ts`
- [x] **3.3** — Cambiar `useState<any[]>` a `useState<Client[]>` en `clients/page.tsx:17`
- [x] **3.4** — Cambiar `firebaseUser: any` a `FirebaseUser | null` en `AuthContext.tsx:30`
- [x] **3.5** — Eliminar `as any` en `pos/page.tsx:210`, `inventory/page.tsx:143` y `clients/page.tsx:79`
- [x] **3.6** — Eliminar `signIn()` vacío de `AuthContext.tsx` y de la interfaz `AuthContextType`

### Fase 4 — Descomponer POS

- [x] **4.1** — Crear `src/hooks/usePOSData.ts` con las 4 suscripciones de `pos/page.tsx`
- [x] **4.2** — Mover filtrado por ubicación a `ProductService.getByLocation()`
- [x] **4.3** — Crear `src/hooks/useOwnerContext.ts` y reemplazar `user?.ownerId ?? user?.uid` en todas las páginas

### Fase 5 — Custom hooks de datos

- [x] **5.1** — Crear `src/hooks/useSales.ts`
- [x] **5.2** — Crear `src/hooks/useCashboxes.ts`
- [x] **5.3** — Crear `src/hooks/useInventory.ts`
- [x] **5.4** — Crear `src/hooks/useClients.ts`
- [x] **5.5** — Crear `src/hooks/useClosings.ts` (reemplaza el polling)
- [x] **5.6** — Crear `src/hooks/useTeam.ts`

### Fase 6 — Error handling

- [x] **6.1** — Crear `src/lib/errors.ts` con clase `ServiceError`
- [x] **6.2** — Wrappear servicios principales en try/catch con `ServiceError`
- [x] **6.3** — Crear `src/hooks/useServiceCall.ts`

### Fase 7 — Dividir useAuth()

- [x] **7.1** — Crear `src/hooks/useSession.ts`
- [x] **7.2** — Crear `src/hooks/useRole.ts`
- [x] **7.3** — Crear `src/hooks/useAuthActions.ts`
- [x] **7.4** — `useAuth()` permanece como composite (sub-hooks llaman a él)
- [x] **7.5** — Migrar `AppLayout.tsx` al nuevo `useRole()`
- [x] **7.6** — Eliminar `useAuth` dead code de `SalePaymentModal.tsx`
- [x] **7.7** — Migrar `CategoryModal.tsx` al nuevo `useOwnerContext()`
- [x] **7.8** — Migrar `MovementHistory.tsx` al nuevo `useOwnerContext()`
- [x] **7.9** — Migrar `inventory/page.tsx` y `reports/page.tsx` a `useOwnerContext()`

---

> **Orden recomendado para empezar hoy:** C1 → C2 → C3 → 3.1 → 3.2 → 3.3 → 3.4
> Son cambios pequeños, seguros, sin riesgo de romper UI, y con impacto real inmediato.

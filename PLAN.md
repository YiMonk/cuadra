# Plan de Implementación — Cuadra v1.0.1

> Generado: 2026-04-26  
> Basado en auditoría de agentes: Architect + Frontend + Backend  
> Fuente de contexto: `ARCHITECTURE.md`

---

## Resumen Ejecutivo

La aplicación tiene una base de UI/UX sólida y flujos críticos bien estructurados (la transacción atómica de `createSale` es correcta en concepto). Sin embargo, hay tres categorías de problemas que **impiden escalar a múltiples negocios de forma segura**:

1. **Multi-tenancy roto** — No hay `ownerId` en documentos de productos, ventas ni clientes. Todos los owners comparten el mismo pool de datos.
2. **Seguridad opaca** — Las Firebase Security Rules no están en el repositorio. Sin poder auditarlas, no se puede garantizar protección.
3. **Bugs de datos activos en producción** — El stock de variantes nunca se descuenta, el dashboard admin filtra el rol equivocado, los pagos de deudas son vulnerables a race conditions.

---

## Índice de Fases

| Fase | Nombre | Duración estimada | Prioridad |
|------|--------|-------------------|-----------|
| [Fase 1](#fase-1--seguridad-crítica) | Seguridad Crítica | 1 semana | BLOQUEANTE |
| [Fase 2](#fase-2--integridad-de-datos) | Integridad de Datos | 1 semana | BLOQUEANTE |
| [Fase 3](#fase-3--bugs-de-ui-activos) | Bugs de UI Activos | 1 semana | ALTO |
| [Fase 4](#fase-4--arquitectura-y-performance) | Arquitectura y Performance | 1-2 semanas | ALTO |
| [Fase 5](#fase-5--features-faltantes) | Features Faltantes | 2 semanas | MEDIO |
| [Fase 6](#fase-6--pwa-y-polish) | PWA y Polish | 1 semana | MEDIO |

---

## Fase 1 — Seguridad Crítica

> **Bloquea el crecimiento a múltiples negocios. Resolver antes de onboarding de nuevos owners.**

---

### [F1-01] Multi-tenancy: agregar `ownerId` a todas las colecciones

**Severidad:** CRÍTICO  
**Área:** Backend + Arquitectura  
**Detectado por:** Architect (SEG-03) + Backend (hallazgo 1)

**Problema:** Ningún documento en `products`, `sales`, `clients`, `categories`, `cashboxes`, `locations`, `stock_movements` tiene un campo `ownerId`. Las queries no filtran por owner, por lo que Owner A puede ver datos de Owner B.

**Archivos a modificar:**
- `src/services/product.service.ts`
- `src/services/sales.service.ts`
- `src/services/client.service.ts`
- `src/services/category.service.ts`
- `src/services/cashbox.service.ts`
- `src/services/location.service.ts`
- Todas las páginas que llaman a estos servicios (pasar `user.uid` o `user.ownerId`)

**Implementación:**

1. **Modificar todos los métodos de creación** para recibir y guardar `ownerId`:
```ts
// product.service.ts — addProduct
addProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, ownerId: string) => {
  return addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...product,
    ownerId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
```

2. **Modificar todas las queries** para filtrar por `ownerId`:
```ts
// product.service.ts — subscribeToProducts
subscribeToProducts: (ownerId: string, callback: (products: Product[]) => void) => {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('ownerId', '==', ownerId),
    orderBy('name')
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
}
```

3. Para `staff`, el `ownerId` a usar es `user.ownerId` (el UID del owner al que pertenece).

4. **Migración de datos existentes:** Ejecutar script one-time para agregar `ownerId` a documentos existentes (solo si hay datos reales en producción).

**Índices Firestore a crear** (`firestore.indexes.json`):
```json
{
  "indexes": [
    { "collectionGroup": "products", "fields": [{ "fieldPath": "ownerId" }, { "fieldPath": "name" }] },
    { "collectionGroup": "sales", "fields": [{ "fieldPath": "ownerId" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "sales", "fields": [{ "fieldPath": "ownerId" }, { "fieldPath": "status" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "clients", "fields": [{ "fieldPath": "ownerId" }, { "fieldPath": "name" }] },
    { "collectionGroup": "categories", "fields": [{ "fieldPath": "ownerId" }, { "fieldPath": "name" }] },
    { "collectionGroup": "sales", "fields": [{ "fieldPath": "clientId" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "users", "fields": [{ "fieldPath": "ownerId" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "admin_activities", "fields": [{ "fieldPath": "targetUserId" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] }
  ]
}
```

---

### [F1-02] Firebase Security Rules — versionar y desplegar

**Severidad:** CRÍTICO  
**Área:** Backend  
**Detectado por:** Architect (SEG-02) + Backend (sección final)

**Problema:** Las Security Rules no están en el repositorio. Sin ellas, cualquier usuario autenticado puede leer/escribir cualquier colección directamente desde la consola o la API REST de Firestore.

**Archivos a crear:**
- `firestore.rules` (raíz del proyecto)
- `storage.rules` (raíz del proyecto)
- `firebase.json` (si no existe, para deploy)

**Implementación — `firestore.rules` completo:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function getRole() {
      return getUserData().role;
    }

    function isAdminGod() {
      return isAuthenticated() && getRole() == 'admingod';
    }

    function isAdmin() {
      return isAuthenticated() && getRole() in ['admingod', 'admin'];
    }

    function isOwner() {
      return isAuthenticated() && getRole() == 'owner';
    }

    function getEffectiveOwnerId() {
      // Para owner: su propio uid. Para staff: el ownerId de su cuenta.
      let userData = getUserData();
      return userData.role == 'owner' ? request.auth.uid : userData.ownerId;
    }

    function ownerIdMatches(docOwnerId) {
      return isAuthenticated() && getEffectiveOwnerId() == docOwnerId;
    }

    function isNotChangingProtectedFields() {
      return !request.resource.data.diff(resource.data)
        .affectedKeys()
        .hasAny(['role', 'active', 'subscriptionEndsAt', 'subscriptionPrice']);
    }

    // ── users ──────────────────────────────────────────────────────────────
    match /users/{userId} {
      allow read: if isAdmin() || request.auth.uid == userId
        || (isAuthenticated() && resource.data.ownerId == getEffectiveOwnerId());
      allow create: if request.auth.uid == userId
        && request.resource.data.role == 'owner'
        && request.resource.data.active == true;
      allow create: if isAdmin();
      allow update: if request.auth.uid == userId && isNotChangingProtectedFields();
      allow update: if isAdmin();
      allow delete: if isAdminGod();
    }

    // ── products ───────────────────────────────────────────────────────────
    match /products/{productId} {
      allow read: if ownerIdMatches(resource.data.ownerId);
      allow create: if isAuthenticated()
        && ownerIdMatches(request.resource.data.ownerId)
        && request.resource.data.price is number && request.resource.data.price >= 0
        && request.resource.data.stock is number && request.resource.data.stock >= 0;
      allow update: if ownerIdMatches(resource.data.ownerId)
        && request.resource.data.ownerId == resource.data.ownerId;
      allow delete: if isOwner() && request.auth.uid == resource.data.ownerId;
    }

    // ── sales ──────────────────────────────────────────────────────────────
    match /sales/{saleId} {
      allow read: if ownerIdMatches(resource.data.ownerId);
      allow create: if isAuthenticated()
        && ownerIdMatches(request.resource.data.ownerId)
        && request.resource.data.total is number && request.resource.data.total >= 0
        && request.resource.data.status in ['paid', 'pending']
        && request.resource.data.paymentMethod in ['cash', 'transfer', 'mobile_pay', 'credit'];
      allow update: if ownerIdMatches(resource.data.ownerId)
        && request.resource.data.ownerId == resource.data.ownerId
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['items', 'total', 'createdBy', 'ownerId']);
      allow delete: if false;
    }

    // ── clients ────────────────────────────────────────────────────────────
    match /clients/{clientId} {
      allow read: if ownerIdMatches(resource.data.ownerId);
      allow create: if isAuthenticated() && ownerIdMatches(request.resource.data.ownerId);
      allow update: if ownerIdMatches(resource.data.ownerId)
        && request.resource.data.ownerId == resource.data.ownerId;
      allow delete: if isOwner() && request.auth.uid == resource.data.ownerId;
    }

    // ── categories ─────────────────────────────────────────────────────────
    match /categories/{catId} {
      allow read: if ownerIdMatches(resource.data.ownerId);
      allow create: if isAuthenticated() && ownerIdMatches(request.resource.data.ownerId);
      allow update: if ownerIdMatches(resource.data.ownerId);
      allow delete: if isOwner() && request.auth.uid == resource.data.ownerId;
    }

    // ── cashboxes ──────────────────────────────────────────────────────────
    match /cashboxes/{cashboxId} {
      allow read: if ownerIdMatches(resource.data.ownerId);
      allow create: if isOwner() && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if isOwner() && request.auth.uid == resource.data.ownerId;
    }

    // ── locations ──────────────────────────────────────────────────────────
    match /locations/{locationId} {
      allow read: if ownerIdMatches(resource.data.ownerId);
      allow create: if isOwner() && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if isOwner() && request.auth.uid == resource.data.ownerId;
    }

    // ── stock_movements ────────────────────────────────────────────────────
    match /stock_movements/{movId} {
      allow read: if ownerIdMatches(resource.data.ownerId);
      allow create: if isAuthenticated() && ownerIdMatches(request.resource.data.ownerId);
      allow update, delete: if false;
    }

    // ── admin_activities ───────────────────────────────────────────────────
    match /admin_activities/{activityId} {
      allow read: if isAdmin();
      allow create: if isAdmin() && request.resource.data.adminId == request.auth.uid;
      allow update, delete: if false;
    }

    // ── app_config ─────────────────────────────────────────────────────────
    match /app_config/{docId} {
      allow read: if docId == 'version' || isAdminGod();
      allow write: if isAdminGod();
    }
  }
}
```

**Nota crítica:** Las funciones helper usan `get()` para leer el rol del usuario — esto es un `document read` adicional por operación de Firestore y tiene costo. La alternativa óptima (para Fase 4) es usar Firebase Custom Claims para que el rol viaje en el token JWT sin necesitar reads adicionales.

---

### [F1-03] Mover `wipeDatabase` a Cloud Function

**Severidad:** CRÍTICO  
**Área:** Backend  
**Detectado por:** Architect (SEG-04) + Backend (hallazgo 2)

**Problema:** `DataManager.wipeDatabase` se ejecuta completamente en el cliente. Cualquier usuario autenticado puede invocarla desde la consola del navegador si las Security Rules lo permiten.

**Archivos a crear/modificar:**
- `functions/src/admin.ts` (nueva Cloud Function)
- `src/services/DataManager.ts` (reemplazar lógica por llamada a la Function)

**Implementación:**
```ts
// functions/src/admin.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export const wipeDatabase = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida');
  }
  const user = await admin.auth().getUser(context.auth.uid);
  if (user.customClaims?.role !== 'admingod') {
    throw new functions.https.HttpsError('permission-denied', 'Solo AdminGod puede ejecutar esta operación');
  }
  // Lógica de wipe con Admin SDK (acceso sin restricciones de Security Rules)
  const db = admin.firestore();
  const collections = ['sales', 'products', 'clients', 'users'];
  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    const batch = db.batch();
    let count = 0;
    for (const doc of snapshot.docs) {
      if (col === 'users' && doc.id === context.auth.uid) continue;
      batch.delete(doc.ref);
      count++;
      if (count >= 400) { await batch.commit(); count = 0; }
    }
    if (count > 0) await batch.commit();
  }
});
```

```ts
// src/services/DataManager.ts — reemplazar por:
import { getFunctions, httpsCallable } from 'firebase/functions';

export const DataManager = {
  wipeDatabase: async () => {
    const functions = getFunctions();
    const wipeFn = httpsCallable(functions, 'wipeDatabase');
    return wipeFn();
  }
};
```

---

### [F1-04] Crear staff desde Cloud Function (no desde el cliente)

**Severidad:** CRÍTICO  
**Área:** Backend + Frontend  
**Detectado por:** Architect (FEAT-03) + Frontend (hallazgo 13)

**Problema:** Crear un usuario con `createUserWithEmailAndPassword` desde el cliente hace que Firebase Auth loguee automáticamente al nuevo staff, deslogueando al owner. Además, no hay validación server-side.

**Archivos a crear/modificar:**
- `functions/src/team.ts` (nueva Cloud Function)
- `src/app/team/page.tsx` (reemplazar la llamada directa a Firebase Auth)

**Implementación (Cloud Function):**
```ts
export const createStaffMember = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', '');
  
  const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const callerRole = callerDoc.data()?.role;
  if (callerRole !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Solo owners pueden crear staff');
  }

  const { email, password, displayName } = data;
  const userRecord = await admin.auth().createUser({ email, password, displayName });
  
  await admin.firestore().collection('users').doc(userRecord.uid).set({
    email, displayName, role: 'staff',
    ownerId: context.auth.uid,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Asignar custom claims
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: 'staff',
    ownerId: context.auth.uid
  });

  return { uid: userRecord.uid };
});
```

Análogamente, **eliminar staff** también debe ir a una Cloud Function que llame `admin.auth().deleteUser(uid)`.

---

## Fase 2 — Integridad de Datos

> **Bugs que corrompen datos en producción activa.**

---

### [F2-01] Corregir descuento de stock de variantes en `createSale`

**Severidad:** CRÍTICO  
**Área:** Backend  
**Detectado por:** Architect (DAT-02) + Backend (hallazgo 6) + Frontend (hallazgo 6)

**Problema:** Cuando se vende un item con `variantId`, el código descuenta `product.stock` (global) pero nunca actualiza `variant.stock`. El inventario de variantes siempre es incorrecto.

**Archivo:** `src/services/sales.service.ts`

**Implementación — dentro de `runTransaction` en `createSale`:**
```ts
// Donde actualmente solo hace: transaction.update(update.ref, { stock: update.newStock })
// Reemplazar por:

for (let i = 0; i < sale.items.length; i++) {
  const item = sale.items[i];
  const productData = productDocs[i].data();
  const productRef = productRefs[i];

  if (item.variantId) {
    const variants = (productData.variants || []) as ProductVariant[];
    const variantIdx = variants.findIndex(v => v.id === item.variantId);
    if (variantIdx === -1) throw new Error(`Variante no encontrada: ${item.variantName}`);
    if (variants[variantIdx].stock < item.quantity) {
      throw new Error(`Stock insuficiente para variante "${item.variantName}" de "${item.name}"`);
    }
    const updatedVariants = variants.map((v, idx) =>
      idx === variantIdx ? { ...v, stock: v.stock - item.quantity } : v
    );
    transaction.update(productRef, { variants: updatedVariants, updatedAt: Date.now() });
  } else {
    const currentStock = productData.stock || 0;
    if (currentStock < item.quantity) {
      throw new Error(`Stock insuficiente para "${item.name}". Disponible: ${currentStock}`);
    }
    transaction.update(productRef, { stock: currentStock - item.quantity, updatedAt: Date.now() });
  }
}
```

---

### [F2-02] Validar stock no negativo en `adjustStock`

**Severidad:** CRÍTICO  
**Área:** Backend  
**Detectado por:** Architect (DAT-04) + Backend (hallazgo 5)

**Archivo:** `src/services/product.service.ts`

**Implementación:**
```ts
// Dentro del runTransaction de adjustStock, después de calcular newStock:
const currentStock = productDoc.data().stock || 0;
const newStock = currentStock + adjustment;
if (newStock < 0) {
  throw new Error(
    `Ajuste inválido: stock resultante sería ${newStock}. Stock actual: ${currentStock}`
  );
}
```

---

### [F2-03] Atomizar `payAllDebts` y `paySpecificDebts` con `writeBatch`

**Severidad:** CRÍTICO  
**Área:** Backend  
**Detectado por:** Architect (DAT-01) + Backend (hallazgo 9)

**Problema:** `Promise.all(updateDoc(...))` no es atómico. Dos cajeros pueden cobrar la misma deuda simultáneamente.

**Archivo:** `src/services/sales.service.ts`

**Implementación:**
```ts
payAllDebts: async (clientId: string, updates: Partial<Sale>) => {
  const q = query(
    collection(db, SALES_COLLECTION),
    where('clientId', '==', clientId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  const now = Date.now();
  snapshot.docs.forEach(docSnap => {
    batch.update(docSnap.ref, { ...updates, status: 'paid', paidAt: now, updatedAt: now });
  });
  await batch.commit();
},

paySpecificDebts: async (saleIds: string[], updates: Partial<Sale>) => {
  const batch = writeBatch(db);
  const now = Date.now();
  for (const id of saleIds) {
    const ref = doc(db, SALES_COLLECTION, id);
    batch.update(ref, { ...updates, status: 'paid', paidAt: now, updatedAt: now });
  }
  await batch.commit();
},
```

---

### [F2-04] Proteger `deleteClient` con verificación de deudas pendientes

**Severidad:** ALTO  
**Área:** Backend  
**Detectado por:** Backend (hallazgo 10)

**Archivo:** `src/services/client.service.ts`

```ts
deleteClient: async (id: string) => {
  const pendingQ = query(
    collection(db, 'sales'),
    where('clientId', '==', id),
    where('status', '==', 'pending'),
    limit(1)
  );
  const pending = await getDocs(pendingQ);
  if (!pending.empty) {
    throw new Error('No se puede eliminar un cliente con deudas pendientes. Salda la deuda primero.');
  }
  await deleteDoc(doc(db, CLIENTS_COLLECTION, id));
},
```

---

### [F2-05] Corregir `getSaleById` — usar `getDoc` en lugar de query por `__name__`

**Severidad:** ALTO  
**Área:** Backend  
**Detectado por:** Architect (ARQ-06) + Backend (hallazgo 12)

**Archivo:** `src/services/sales.service.ts`

```ts
import { getDoc } from 'firebase/firestore';

getSaleById: async (id: string): Promise<Sale | null> => {
  try {
    const docSnap = await getDoc(doc(db, SALES_COLLECTION, id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Sale : null;
  } catch (error) {
    console.error('Error getting sale by ID:', error);
    return null;
  }
},
```

---

### [F2-06] Registrar `stock_movements` en ventas y cancelaciones

**Severidad:** MEDIO  
**Área:** Backend  
**Detectado por:** Architect (DAT-05) + Backend (hallazgo 28)

**Problema:** `createSale` y `cancelSale` modifican el stock sin crear movimientos en `stock_movements`. La trazabilidad de inventario está incompleta.

**Archivo:** `src/services/sales.service.ts`

En la transacción de `createSale`, después de actualizar el stock de cada producto, agregar:
```ts
const movRef = doc(collection(db, 'stock_movements'));
transaction.set(movRef, {
  productId: item.id,
  productName: item.name,
  adjustment: -item.quantity,
  reason: 'sale',
  saleId: saleRef.id,
  ownerId: sale.ownerId, // campo nuevo necesario
  createdAt: Date.now(),
});
```

---

### [F2-07] Guardar la tasa de cambio BCV con cada venta

**Severidad:** MEDIO  
**Área:** Backend + Frontend  
**Detectado por:** Architect (FEAT-07)

**Problema:** Si la tasa BCV cambia, el total en VES de ventas históricas cambia retroactivamente.

**Archivos a modificar:**
- `src/types/sales.ts` — agregar campo `exchangeRateAtSale?: number`
- `src/app/pos/page.tsx` — pasar `exchangeRate` de `CurrencyContext` al crear la venta
- `src/services/sales.service.ts` — incluir el campo en el documento

---

## Fase 3 — Bugs de UI Activos

> **Errores visibles o que causan pérdida de datos desde el frontend.**

---

### [F3-01] Agregar método de pago `mobile_pay` en el POS

**Severidad:** CRÍTICO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 7)

**Problema:** `mobile_pay` (pago móvil, estándar venezolano) está en el tipo `Sale` y en el backend, pero no tiene botón en el modal de checkout del POS.

**Archivo:** `src/app/pos/page.tsx`

Agregar en el grid de métodos de pago del modal de checkout:
```tsx
<button onClick={() => setPaymentMethod('mobile_pay')} className={...}>
  <Smartphone className="w-5 h-5" />
  Pago Móvil
</button>
```

---

### [F3-02] Corregir bug de stock a 0 al editar producto

**Severidad:** CRÍTICO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 14)

**Problema:** Si el campo de stock está vacío en el modal de edición, `parseInt('') || 0` sobreescribe el stock con `0`.

**Archivo:** `src/app/inventory/page.tsx`

```ts
// Antes:
await ProductService.updateProduct(id, { stock: parseInt(stock) || 0, ... });

// Después:
const updates: Partial<Product> = { name, price, category, ... };
if (stock.trim() !== '') {
  updates.stock = parseInt(stock);
}
await ProductService.updateProduct(id, updates);
```

---

### [F3-03] Corregir filtro de owners en el admin dashboard

**Severidad:** ALTO  
**Área:** Frontend  
**Detectado por:** Architect (ARQ-05) + Frontend (hallazgo 12)

**Problema:** El dashboard admin filtra `role === 'admin'` para encontrar owners de negocio, cuando el rol correcto es `'owner'`.

**Archivo:** `src/app/admin/dashboard/page.tsx`

```ts
// Antes (línea ~79):
const owners = useMemo(() => users.filter(u => u.role === 'admin' && ...), [users]);

// Después:
const owners = useMemo(() => users.filter(u => u.role === 'owner'), [users]);
```

---

### [F3-04] Corregir `reloadUser` para re-fetch desde Firestore

**Severidad:** ALTO  
**Área:** Frontend  
**Detectado por:** Architect (SEG-06) + Frontend (hallazgo 4)

**Problema:** `reloadUser` reconstruye el `UserProfile` con el estado React stale, sin volver a leer Firestore. Cambios de rol o suscripción hechos por un admin no se reflejan.

**Archivo:** `src/context/AuthContext.tsx`

```ts
const reloadUser = useCallback(async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  await currentUser.reload();
  const meta = await UserService.getUserById(currentUser.uid);
  if (!meta) return;
  setUser({
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName,
    photoURL: currentUser.photoURL,
    role: meta.role,
    ownerId: meta.ownerId,
    createdAt: meta.createdAt,
    subscriptionEndsAt: meta.subscriptionEndsAt,
  });
}, []);
```

---

### [F3-05] Corregir N+1 query en la página de Cobranzas

**Severidad:** ALTO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 2)

**Problema:** Por cada actualización del listener de ventas pendientes, se hace un `getClientById` por cada cliente único — hasta 50 fetches por tick.

**Archivo:** `src/app/collections/page.tsx`

```ts
// Usar el estado de clientes ya cargado en lugar de fetches individuales
// Agregar una suscripción paralela a clientes:
useEffect(() => {
  if (!user) return;
  const ownerId = user.ownerId || user.uid;
  const unsub = ClientService.subscribeToClients(ownerId, setClients);
  return unsub;
}, [user]);

// En el agrupador de deudas, hacer join en memoria:
const clientMap = useMemo(
  () => new Map(clients.map(c => [c.id, c])),
  [clients]
);
```

---

### [F3-06] Corregir `c.phone` sin optional chaining en búsqueda de clientes del POS

**Severidad:** ALTO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 15)

**Archivo:** `src/app/pos/page.tsx`

```ts
// Antes:
return clients.filter(c =>
  c.name.toLowerCase().includes(search) || c.phone.includes(search)
);

// Después:
return clients.filter(c =>
  c.name.toLowerCase().includes(search) || (c.phone ?? '').includes(search)
);
```

---

### [F3-07] Corregir versión hardcodeada en Settings y UpdateDetector

**Severidad:** ALTO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgos 16 y 33) + Architect (FEAT-05)

**Archivos:**
- `src/app/settings/page.tsx` — reemplazar `"Build v2.1.0"` por `import { APP_VERSION }` de `@/config/version`
- `src/components/common/UpdateDetector.tsx` — guardar `latestVersion` en estado y mostrarlo:
```ts
const [latestVersion, setLatestVersion] = useState('');
// En el callback:
ConfigService.subscribeToVersion((version) => {
  setLatestVersion(version);
  if (version !== APP_VERSION) triggerUpdateFlow();
});
// En el UI:
<p>Cuadra v{APP_VERSION} → v{latestVersion}</p>
```

---

### [F3-08] Inicializar `exchangeRate` con el valor de fallback

**Severidad:** MEDIO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 22)

**Archivo:** `src/context/CurrencyContext.tsx`

```ts
// Antes:
const [exchangeRate, setExchangeRate] = useState<number>(1);

// Después:
const FALLBACK_RATE = 92.50; // Actualizar periódicamente
const [exchangeRate, setExchangeRate] = useState<number>(FALLBACK_RATE);
```

---

### [F3-09] Corregir cálculo de métricas en reportes (excluir canceladas)

**Severidad:** BAJO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 32)

**Archivo:** `src/app/reports/page.tsx`

```ts
// Antes:
const rev = data.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

// Después:
const rev = data
  .filter(s => s.status === 'paid')
  .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
```

---

## Fase 4 — Arquitectura y Performance

> **Mejoras estructurales que reducen costo operacional y facilitan mantenimiento.**

---

### [F4-01] Agregar Next.js Middleware para protección de rutas

**Severidad:** ALTO  
**Área:** Arquitectura  
**Detectado por:** Architect (SEG-01)

**Archivo a crear:** `src/middleware.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const session = request.cookies.get('cuadra-session');

  if (!isPublic && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|manifest|.*\\.png|.*\\.ico).*)'],
};
```

**Complemento:** En `AuthContext.tsx`, al confirmar sesión exitosa, escribir una cookie session con `document.cookie = 'cuadra-session=1; path=/'`. Al hacer signOut, eliminarla.

---

### [F4-02] Implementar Firebase Custom Claims para roles

**Severidad:** ALTO  
**Área:** Backend  
**Detectado por:** Backend (sección final de Security Rules)

**Problema:** Las Security Rules actuales usan `get()` para leer el rol — esto cuesta 1 read adicional por operación. Con Custom Claims, el rol viaja en el JWT sin costo adicional.

**Cloud Function:**
```ts
// functions/src/onUserWrite.ts
export const syncUserClaims = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const data = change.after.data();
    if (!data) {
      await admin.auth().setCustomUserClaims(context.params.userId, null);
      return;
    }
    await admin.auth().setCustomUserClaims(context.params.userId, {
      role: data.role,
      ownerId: data.ownerId || context.params.userId,
    });
  });
```

Una vez desplegada, actualizar las Security Rules para usar `request.auth.token.role` en lugar de `get()`.

---

### [F4-03] Implementar paginación en `getAllSales` y reportes

**Severidad:** ALTO  
**Área:** Backend + Frontend  
**Detectado por:** Architect (PERF-01) + Backend (hallazgo 8)

**Archivo:** `src/services/sales.service.ts`

```ts
getAllSales: async (options?: {
  ownerId?: string;
  startDate?: number;
  endDate?: number;
  pageSize?: number;
  startAfterDoc?: DocumentSnapshot;
}) => {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (options?.ownerId) constraints.push(where('ownerId', '==', options.ownerId));
  if (options?.startDate) constraints.push(where('createdAt', '>=', options.startDate));
  if (options?.endDate) constraints.push(where('createdAt', '<=', options.endDate));
  if (options?.startAfterDoc) constraints.push(startAfter(options.startAfterDoc));
  constraints.push(limit(options?.pageSize ?? 500));

  const q = query(collection(db, SALES_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  return {
    sales: snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale)),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
  };
},
```

---

### [F4-04] Agregar Error Boundaries en zonas críticas

**Severidad:** ALTO  
**Área:** Frontend  
**Detectado por:** Architect (FEAT-01)

**Archivo a crear:** `src/components/common/ErrorBoundary.tsx`

```tsx
import React from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-500 font-medium">Ocurrió un error inesperado</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Envolver en `src/app/pos/page.tsx`, `src/app/reports/page.tsx`, y `src/app/admin/dashboard/page.tsx`.

---

### [F4-05] Extraer lógica de notificaciones de `AppLayout` a un hook

**Severidad:** MEDIO  
**Área:** Arquitectura + Frontend  
**Detectado por:** Architect (ARQ-01) + Frontend (hallazgo 8)

**Archivo a crear:** `src/hooks/useNotifications.ts`

```ts
export function useNotifications(user: UserProfile | null) {
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const ownerId = user.ownerId || user.uid;
    const unsub = SalesService.subscribeToPendingSales(ownerId, (sales) => {
      const clientIds = new Set(sales.map(s => s.clientId).filter(Boolean));
      setPendingSalesCount(clientIds.size);
    });
    return unsub;
  }, [user]);

  return { pendingSalesCount, lowStockCount };
}
```

---

### [F4-06] Unificar tipo `CartItem` — eliminar duplicado entre CartContext y `types/sales.ts`

**Severidad:** ALTO  
**Área:** Arquitectura  
**Detectado por:** Architect (ARQ-02) + Frontend (hallazgo 3)

**Implementación:**
1. Definir un único `CartItem` en `src/types/sales.ts` que incluya `finalPrice: number`.
2. Importarlo en `CartContext.tsx` en lugar del tipo local.
3. Eliminar el tipo `any` de `selectedClient` — usar el tipo `Client` de `src/types/client.ts`.
4. Agregar `finalPrice` al cálculo de `addToCart` (igual al precio sin descuento por ahora).

---

### [F4-07] Cachear tasa BCV en `sessionStorage`

**Severidad:** MEDIO  
**Área:** Frontend + Backend  
**Detectado por:** Architect (PERF-04) + Backend (hallazgo 14)

**Archivo:** `src/context/CurrencyContext.tsx`

```ts
const fetchRate = async () => {
  const cached = sessionStorage.getItem('bcv-rate');
  if (cached) {
    const { rate, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 30 * 60 * 1000) {
      setExchangeRate(rate);
      setIsLoading(false);
      return;
    }
  }
  try {
    const res = await fetch('/api/bcv');
    const data = await res.json();
    setExchangeRate(data.rate);
    sessionStorage.setItem('bcv-rate', JSON.stringify({ rate: data.rate, timestamp: Date.now() }));
  } catch {
    // Mantiene el valor de fallback
  } finally {
    setIsLoading(false);
  }
};
```

---

### [F4-08] Agregar `onError` a todas las subscripciones de Firestore

**Severidad:** MEDIO  
**Área:** Backend  
**Detectado por:** Backend (hallazgo 16)

Todos los `onSnapshot` en los servicios deben recibir un segundo argumento de error:
```ts
return onSnapshot(
  q,
  (snapshot) => { callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); },
  (error) => { console.error(`Error en subscription ${COLLECTION}:`, error); }
);
```

Aplicar a: `product.service.ts`, `client.service.ts`, `sales.service.ts`, `user.service.ts`, `category.service.ts`, `cashbox.service.ts`, `activity.service.ts`, `config.service.ts`.

---

### [F4-09] Crear `firestore.indexes.json`

**Severidad:** MEDIO  
**Área:** Backend  
**Detectado por:** Backend (hallazgo 17)

Ver los índices definidos en [F1-01](#f1-01-multi-tenancy-agregar-ownerid-a-todas-las-colecciones). Crear el archivo en la raíz del proyecto para que `firebase deploy --only firestore:indexes` los despliegue automáticamente.

---

### [F4-10] Mover `Cashbox` y `Location` interfaces a `src/types/`

**Severidad:** BAJO  
**Área:** Arquitectura  
**Detectado por:** Backend (hallazgo 26)

Crear `src/types/cashbox.ts` y `src/types/location.ts` e importar desde los servicios.

---

## Fase 5 — Features Faltantes

> **Funcionalidades que faltan para un POS completo.**

---

### [F5-01] Capturar `paymentData` en el modal de checkout del POS

**Severidad:** MEDIO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 24)

**Problema:** El tipo `Sale.paymentData = { reference?, bank?, date? }` existe pero los campos no tienen inputs en la UI. Para pagos de transferencia/pago móvil no se captura la referencia bancaria.

**Archivo:** `src/app/pos/page.tsx`

Agregar campos condicionales en el modal de checkout cuando `paymentMethod === 'transfer' || 'mobile_pay'`:
```tsx
{(paymentMethod === 'transfer' || paymentMethod === 'mobile_pay') && (
  <div className="space-y-2">
    <Input placeholder="Número de referencia" value={reference} onChange={e => setReference(e.target.value)} />
    <Input placeholder="Banco" value={bank} onChange={e => setBank(e.target.value)} />
    <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
  </div>
)}
```

---

### [F5-02] Selector de variantes en el catálogo del POS

**Severidad:** MEDIO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 26)

**Problema:** Hacer click en un producto con variantes agrega directamente el producto sin variante. No hay forma de seleccionar una variante específica.

**Implementación:** Mostrar un mini-modal o dropdown de variantes al hacer click en un producto con `variants.length > 0`.

---

### [F5-03] Agregar balance de caja al `CashboxService`

**Severidad:** MEDIO  
**Área:** Backend  
**Detectado por:** Backend (hallazgo 22)

```ts
// cashbox.service.ts
getCashboxBalance: async (cashboxId: string, startDate: number, endDate: number) => {
  const q = query(
    collection(db, 'sales'),
    where('cashboxId', '==', cashboxId),
    where('status', '==', 'paid'),
    where('createdAt', '>=', startDate),
    where('createdAt', '<=', endDate)
  );
  const snapshot = await getDocs(q);
  const sales = snapshot.docs.map(d => d.data() as Sale);
  return {
    total: sales.reduce((sum, s) => sum + s.total, 0),
    count: sales.length,
    byPaymentMethod: sales.reduce((acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.total;
      return acc;
    }, {} as Record<string, number>),
  };
},
```

---

### [F5-04] Botón "Pagar deuda" directamente en la lista de Cobranzas

**Severidad:** MEDIO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 21)

**Problema:** El botón "Gestionar" navega al perfil del cliente. No se puede marcar una deuda como pagada sin salir de la pantalla de Cobranzas.

Agregar un botón "Cobrar todo" por cliente que llame directamente a `SalesService.payAllDebts` con un modal de confirmación de método de pago.

---

### [F5-05] Agregar confirmación por texto para el wipe de base de datos

**Severidad:** MEDIO  
**Área:** Frontend  
**Detectado por:** Frontend (hallazgo 23)

**Archivo:** `src/app/admin/dashboard/page.tsx`

Reemplazar el toast de confirmación por un modal que exija escribir `"ELIMINAR TODO"` antes de ejecutar el wipe (similar al modal de eliminación de staff en `/team`).

---

### [F5-06] Implementar servicio de resumen de reportes por período

**Severidad:** MEDIO  
**Área:** Backend  
**Detectado por:** Backend (hallazgo 21)

Mover la lógica de cálculo de métricas de `reports/page.tsx` a `SalesService.getSalesSummary(ownerId, startDate, endDate)`. La página solo llama al servicio y renderiza los resultados.

---

### [F5-07] Soft delete para productos y clientes

**Severidad:** MEDIO  
**Área:** Backend  
**Detectado por:** Architect (FEAT-06) + Backend (hallazgo 11)

Reemplazar `deleteDoc` por `updateDoc({ deletedAt: Date.now(), active: false })` en `product.service.ts` y `client.service.ts`. Actualizar las queries para filtrar `where('active', '==', true)`.

---

## Fase 6 — PWA y Polish

> **Completar la experiencia PWA y limpiar deuda técnica menor.**

---

### [F6-01] Corregir manifest.json e iconos PWA

**Severidad:** ALTO  
**Área:** PWA  
**Detectado por:** Architect (PWA-01)

**Archivo:** `public/manifest.json`

1. Generar iconos PNG: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` y copiar a `/public/`.
2. Actualizar manifest:
```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
3. En `src/app/layout.tsx` agregar: `<link rel="apple-touch-icon" href="/icon-192.png" />`.

---

### [F6-02] Configurar estrategia offline en el Service Worker

**Severidad:** MEDIO  
**Área:** PWA  
**Detectado por:** Architect (PWA-02)

**Archivo:** `next.config.ts`

```ts
withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV !== 'production',
  register: true,
  runtimeCaching: [
    { urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i, handler: 'CacheFirst' },
    { urlPattern: /^https:\/\/firebaseapp\.com\/.*/i, handler: 'NetworkFirst' },
    { urlPattern: /\/api\/bcv/, handler: 'StaleWhileRevalidate',
      options: { cacheName: 'bcv-api-cache', expiration: { maxAgeSeconds: 3600 } } },
  ],
})
```

**Complemento:** Habilitar persistencia offline de Firestore en `firebaseConfig.ts`:
```ts
import { enableIndexedDbPersistence } from 'firebase/firestore';
enableIndexedDbPersistence(db).catch(err => console.warn('Offline persistence unavailable:', err));
```

---

### [F6-03] Eliminar `console.log` y `console.warn` en `AuthContext.tsx`

**Severidad:** BAJO  
**Área:** Seguridad  
**Detectado por:** Frontend (hallazgo 35)

Reemplazar todos los `console.log` del `AuthContext.tsx` por condición de entorno:
```ts
if (process.env.NODE_ENV === 'development') console.log('...');
```

---

### [F6-04] Agregar `aria-label` a botones de ícono y `role="dialog"` a modales

**Severidad:** BAJO  
**Área:** Accesibilidad  
**Detectado por:** Frontend (hallazgos 29 y 30)

En `AppLayout.tsx` y los modales de toda la app, agregar atributos ARIA básicos.

---

### [F6-05] Corregir regex de parseo de tasa BCV para números con miles

**Severidad:** MEDIO  
**Área:** Backend  
**Detectado por:** Backend (hallazgo 19)

**Archivo:** `src/app/api/bcv/route.ts`

```ts
// Antes:
const bcvRate = parseFloat(dolarSection[1].replace(',', '.'));

// Después (maneja separadores de miles):
const rawRate = dolarSection[1].replace(/\./g, '').replace(',', '.');
const bcvRate = parseFloat(rawRate);
if (isNaN(bcvRate) || bcvRate <= 0) {
  throw new Error(`Tasa parseada inválida: "${dolarSection[1]}"`);
}
```

---

### [F6-06] Actualizar `PromoRule` — implementar o eliminar el dead code

**Severidad:** BAJO  
**Área:** Arquitectura  
**Detectado por:** Architect (ARQ-07)

`PromoRule` en `types/sales.ts` está definida pero nunca implementada. Decidir: si no hay planes de implementar descuentos a corto plazo, eliminar la interfaz. Si sí, crear un `PromoService` básico.

---

## Resumen de Items por Agente Responsable

### Backend debe ejecutar
F1-01, F1-02, F1-03, F1-04, F2-01, F2-02, F2-03, F2-04, F2-05, F2-06, F2-07, F4-02, F4-03, F4-08, F4-09, F4-10, F5-03, F5-06, F5-07, F6-05

### Frontend debe ejecutar
F3-01, F3-02, F3-03, F3-04, F3-05, F3-06, F3-07, F3-08, F3-09, F4-04, F4-05, F4-06, F4-07, F5-01, F5-02, F5-04, F5-05, F6-03, F6-04

### Arquitectura/Config
F1-01 (índices), F4-01, F6-01, F6-02, F6-06

---

## Tabla de Seguimiento

| ID | Descripción | Fase | Área | Prioridad | Estado |
|----|-------------|------|------|-----------|--------|
| F1-01 | Multi-tenancy: `ownerId` en todas las colecciones | 1 | Backend | CRÍTICO | ✅ Completado |
| F1-02 | Firebase Security Rules versionadas | 1 | Backend | CRÍTICO | ✅ Completado |
| F1-03 | `wipeDatabase` a Cloud Function | 1 | Backend | CRÍTICO | ✅ Completado |
| F1-04 | Crear staff con Cloud Function | 1 | Backend | CRÍTICO | ✅ Completado |
| F2-01 | Descuento correcto de stock de variantes | 2 | Backend | CRÍTICO | ✅ Completado |
| F2-02 | Validar stock no negativo en `adjustStock` | 2 | Backend | CRÍTICO | ✅ Completado |
| F2-03 | `writeBatch` en `payAllDebts`/`paySpecificDebts` | 2 | Backend | CRÍTICO | ✅ Completado |
| F2-04 | Proteger `deleteClient` con verificación de deudas | 2 | Backend | ALTO | ✅ Completado |
| F2-05 | `getSaleById` usar `getDoc` | 2 | Backend | ALTO | ✅ Completado |
| F2-06 | `stock_movements` en ventas y cancelaciones | 2 | Backend | MEDIO | ✅ Completado |
| F2-07 | Guardar tasa BCV en cada venta | 2 | Backend | MEDIO | ✅ Completado |
| F3-01 | Agregar `mobile_pay` en el POS | 3 | Frontend | CRÍTICO | ✅ Completado |
| F3-02 | Bug stock a 0 al editar producto | 3 | Frontend | CRÍTICO | ✅ Completado |
| F3-03 | Filtro incorrecto de owners en admin | 3 | Frontend | ALTO | ✅ Completado |
| F3-04 | `reloadUser` re-fetch Firestore | 3 | Frontend | ALTO | ✅ Completado |
| F3-05 | N+1 query en Cobranzas | 3 | Frontend | ALTO | ✅ Completado |
| F3-06 | `c.phone` optional chaining | 3 | Frontend | ALTO | ✅ Completado |
| F3-07 | Versión hardcodeada en Settings/UpdateDetector | 3 | Frontend | ALTO | ✅ Completado |
| F3-08 | `exchangeRate` inicial con fallback real | 3 | Frontend | MEDIO | ✅ Completado |
| F3-09 | Excluir canceladas de métricas de reportes | 3 | Frontend | BAJO | ✅ Completado |
| F4-01 | Next.js Middleware para rutas | 4 | Arquitectura | ALTO | ✅ Completado |
| F4-02 | Firebase Custom Claims para roles | 4 | Backend | ALTO | ✅ Completado |
| F4-03 | Paginación en `getAllSales` | 4 | Backend | ALTO | ✅ Completado |
| F4-04 | Error Boundaries en zonas críticas | 4 | Frontend | ALTO | ✅ Completado |
| F4-05 | Hook `useNotifications` desde AppLayout | 4 | Frontend | MEDIO | ✅ Completado |
| F4-06 | Unificar tipo `CartItem` | 4 | Frontend | ALTO | ✅ Completado |
| F4-07 | Caché de tasa BCV en `sessionStorage` | 4 | Frontend | MEDIO | ✅ Completado |
| F4-08 | `onError` en subscripciones Firestore | 4 | Backend | MEDIO | ✅ Completado |
| F4-09 | Crear `firestore.indexes.json` | 4 | Backend | MEDIO | ✅ Completado |
| F4-10 | Mover interfaces `Cashbox`/`Location` a `/types` | 4 | Arquitectura | BAJO | ✅ Completado |
| F5-01 | Capturar `paymentData` en checkout POS | 5 | Frontend | MEDIO | ✅ Completado |
| F5-02 | Selector de variantes en catálogo POS | 5 | Frontend | MEDIO | ✅ Completado |
| F5-03 | Balance de caja en `CashboxService` | 5 | Backend | MEDIO | ✅ Completado |
| F5-04 | Pagar deuda directamente en Cobranzas | 5 | Frontend | MEDIO | ✅ Completado |
| F5-05 | Confirmación por texto para wipe | 5 | Frontend | MEDIO | ✅ Completado |
| F5-06 | Servicio de resumen de reportes | 5 | Backend | MEDIO | ✅ Completado |
| F5-07 | Soft delete en productos y clientes | 5 | Backend | MEDIO | ✅ Completado |
| F6-01 | Corregir manifest.json e iconos PWA | 6 | Config | ALTO | 🔶 Parcial (faltan PNGs) |
| F6-02 | Estrategia offline en Service Worker + IndexedDB persistence | 6 | Config | MEDIO | ✅ Completado |
| F6-03 | Eliminar console.log en producción | 6 | Frontend | BAJO | ✅ Completado |
| F6-04 | Atributos ARIA en botones y modales | 6 | Frontend | BAJO | ✅ Completado |
| F6-05 | Regex BCV para números con miles | 6 | Backend | MEDIO | ✅ Completado |
| F6-06 | Eliminar o implementar `PromoRule` | 6 | Arquitectura | BAJO | ✅ Completado |

---

*Total: 42 items | 6 CRÍTICOS (Fase 1) + 5 CRÍTICOS (Fase 2-3) = 11 críticos a resolver primero*

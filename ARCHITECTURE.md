# Cuadra — Documentación Técnica Completa

> Sistema de Punto de Venta, Inventario y Gestión de Negocio — PWA para el mercado venezolano

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Configuración y Arranque](#4-configuración-y-arranque)
5. [Arquitectura de Capas](#5-arquitectura-de-capas)
6. [Capa de Contexto (Estado Global)](#6-capa-de-contexto-estado-global)
7. [Capa de Servicios (Firestore)](#7-capa-de-servicios-firestore)
8. [Esquema de Firestore](#8-esquema-de-firestore)
9. [Tipos TypeScript](#9-tipos-typescript)
10. [Módulos de la Aplicación (Páginas)](#10-módulos-de-la-aplicación-páginas)
11. [Layout y Navegación](#11-layout-y-navegación)
12. [API Routes (Backend)](#12-api-routes-backend)
13. [Sistema de Autenticación y Roles](#13-sistema-de-autenticación-y-roles)
14. [Flujo de Venta (POS)](#14-flujo-de-venta-pos)
15. [Sistema de Moneda (USD/VES)](#15-sistema-de-moneda-usdves)
16. [Sistema de Actualizaciones PWA](#16-sistema-de-actualizaciones-pwa)
17. [Integraciones Externas](#17-integraciones-externas)
18. [Componentes Compartidos](#18-componentes-compartidos)
19. [Variables de Entorno](#19-variables-de-entorno)

---

## 1. Visión General

**Cuadra** es una Progressive Web Application (PWA) diseñada para pequeños y medianos negocios del mercado venezolano. Permite gestionar ventas, inventario, clientes, cobranzas y reportes desde cualquier dispositivo, con soporte dual de moneda USD/VES usando la tasa oficial BCV.

**Características clave:**
- Punto de Venta (POS) en tiempo real con carrito persistente
- Inventario con control de stock y movimientos atómicos
- Cobranzas: seguimiento de deudas a crédito con recordatorios WhatsApp
- Reportes con gráficas y exportación Excel/PDF
- Multi-rol: AdminGod → Admin → Owner → Staff
- Suscripción mensual con validación automática
- Modo oscuro/claro + instalable como app nativa (PWA)

---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Tipos | TypeScript | 5 |
| Estilos | Tailwind CSS | 4 |
| Backend | Firebase (Auth + Firestore + Storage) | 12.10.0 |
| Iconos | Lucide React | 0.577.0 |
| Notificaciones | Sonner | 2.0.7 |
| Temas | next-themes | 0.4.6 |
| Gráficas | Recharts | 3.7.0 |
| Excel Export | XLSX | 0.18.5 |
| PDF Export | jsPDF + jsPDF-AutoTable | 4.2.1 / 5.0.7 |
| PWA | @ducanh2912/next-pwa | 10.2.9 |
| CSS Utils | tailwind-merge | 3.5.0 |

---

## 3. Estructura de Carpetas

```
cuadra/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (providers + AppLayout)
│   │   ├── page.tsx                  # Home — redirige según rol
│   │   ├── providers.tsx             # Árbol de Context providers
│   │   ├── globals.css               # Estilos globales Tailwind
│   │   ├── api/
│   │   │   └── bcv/route.ts          # API Route: tasa BCV (USD→VES)
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── pos/page.tsx              # Punto de Venta
│   │   ├── inventory/page.tsx        # Inventario
│   │   ├── clients/
│   │   │   ├── page.tsx              # Lista de clientes
│   │   │   └── [clientId]/page.tsx   # Detalle de cliente
│   │   ├── collections/page.tsx      # Cobranzas
│   │   ├── reports/page.tsx          # Reportes y analytics
│   │   ├── team/page.tsx             # Gestión de equipo
│   │   ├── settings/page.tsx         # Configuración
│   │   ├── menu/page.tsx             # Menú (placeholder)
│   │   └── admin/
│   │       ├── dashboard/page.tsx    # Panel AdminGod/Admin
│   │       ├── users/
│   │       │   ├── page.tsx          # Lista de usuarios
│   │       │   └── [userId]/page.tsx # Detalle de usuario
│   │       └── activities/page.tsx   # Log de actividades
│   ├── components/
│   │   ├── ui/                       # Componentes base reutilizables
│   │   ├── layout/
│   │   │   └── AppLayout.tsx         # Navegación principal (sidebar + bottom nav)
│   │   ├── inventory/
│   │   │   └── CategoryModal.tsx     # Modal de categorías
│   │   └── common/
│   │       └── UpdateDetector.tsx    # Detector de actualización PWA
│   ├── context/
│   │   ├── AuthContext.tsx           # Sesión de usuario y validaciones
│   │   ├── CartContext.tsx           # Estado del carrito POS
│   │   ├── CurrencyContext.tsx       # Conversión USD/VES + tasa BCV
│   │   └── ThemeContext.tsx          # Dark/light mode
│   ├── services/                     # Lógica de negocio → Firestore
│   │   ├── user.service.ts
│   │   ├── product.service.ts
│   │   ├── sales.service.ts
│   │   ├── client.service.ts
│   │   ├── category.service.ts
│   │   ├── location.service.ts
│   │   ├── cashbox.service.ts
│   │   ├── activity.service.ts
│   │   ├── config.service.ts
│   │   └── DataManager.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── inventory.ts
│   │   ├── sales.ts
│   │   ├── client.ts
│   │   ├── category.ts
│   │   └── activity.ts
│   ├── hooks/
│   │   └── useContactPicker.ts       # Contact Picker API (móvil)
│   └── config/
│       ├── firebaseConfig.ts         # Inicialización Firebase (singleton)
│       └── version.ts                # APP_VERSION = '1.0.1'
├── public/
│   └── manifest.json                 # PWA Manifest
├── next.config.ts                    # Config Next.js + PWA
├── tailwind.config.ts
└── tsconfig.json                     # Path alias @/* → ./src/*
```

---

## 4. Configuración y Arranque

### Firebase (`src/config/firebaseConfig.ts`)

Inicialización singleton: verifica si ya existe una instancia con `getApps().length === 0` antes de inicializar.

```ts
// Exports disponibles
export { auth };          // Firebase Auth instance
export const db;          // Firestore instance
export const storage;     // Cloud Storage instance
```

### Versión de App (`src/config/version.ts`)

```ts
export const APP_VERSION = '1.0.1';
```

Este valor se compara contra `app_config/version.latest` en Firestore para detectar actualizaciones.

### Next.js + PWA (`next.config.ts`)

- PWA deshabilitado en desarrollo (`NODE_ENV !== 'production'`)
- Service worker auto-registrado en producción
- Path alias `@/*` → `./src/*` (definido en `tsconfig.json`)

### Providers (`src/app/providers.tsx`)

El árbol de providers se aplica en este orden (de afuera hacia adentro):

```
ThemeProvider
  └── AuthProvider
        └── CartProvider
              └── CurrencyProvider
                    └── {children}
                    └── <UpdateDetector />
                    └── <Toaster position="top-right" richColors closeButton />
```

### Root Layout (`src/app/layout.tsx`)

```tsx
// Metadata PWA
metadata.title = "Cuadra APP"
metadata.manifest = "/manifest.json"

// Viewport: sin zoom (app nativa)
viewport.userScalable = false
viewport.viewportFit = "cover"

// Estructura
<html lang="es">
  <body>
    <Providers>
      <AppLayout>
        {children}   ← Páginas de Next.js
      </AppLayout>
    </Providers>
  </body>
</html>
```

---

## 5. Arquitectura de Capas

```
┌──────────────────────────────────────────────────────┐
│                   PÁGINAS (Next.js)                   │
│  /pos  /inventory  /clients  /reports  /admin/...     │
└────────────────────┬─────────────────────────────────┘
                     │ consumen
┌────────────────────▼─────────────────────────────────┐
│              CONTEXTOS (React Context API)            │
│  AuthContext · CartContext · CurrencyContext · Theme  │
└────────────────────┬─────────────────────────────────┘
                     │ llaman a
┌────────────────────▼─────────────────────────────────┐
│                SERVICIOS (Business Logic)             │
│  UserService · ProductService · SalesService         │
│  ClientService · CategoryService · CashboxService    │
│  ActivityService · ConfigService · DataManager       │
└────────────────────┬─────────────────────────────────┘
                     │ operan sobre
┌────────────────────▼─────────────────────────────────┐
│                  FIREBASE                             │
│  Firebase Auth │ Firestore (real-time) │ Storage      │
└────────────────────┬─────────────────────────────────┘
                     │ + APIs externas
┌────────────────────▼─────────────────────────────────┐
│  BCV Rate API (ve.dolarapi.com) │ WhatsApp Web        │
└──────────────────────────────────────────────────────┘
```

---

## 6. Capa de Contexto (Estado Global)

### AuthContext (`src/context/AuthContext.tsx`)

Gestiona la sesión del usuario usando `onAuthStateChanged` de Firebase Auth.

**Flujo de autenticación al detectar un usuario:**
1. Fetch de metadatos desde Firestore (`users/{uid}`)
2. Si no existen metadatos → los crea con rol `owner` por defecto
3. Si el email cambió en Firebase Auth → sincroniza en Firestore
4. Si `meta.active === false` → hace signOut automático
5. Si es `staff` y su owner está inactivo o con suscripción vencida → signOut
6. Si es `owner` y `subscriptionEndsAt < Date.now()` → signOut automático
7. Construye el `UserProfile` y lo setea en estado

**Timeout de seguridad:** Si `onAuthStateChanged` no responde en 5 segundos, fuerza `isLoading = false` para no bloquear la UI.

**Interfaz expuesta por el contexto:**
```ts
interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;        // placeholder
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
}
```

**Hook de consumo:** `useAuth()`

---

### CartContext (`src/context/CartContext.tsx`)

Estado en memoria del carrito del POS. No persiste entre sesiones.

**Estado:**
```ts
items: CartItem[]       // productos en el carrito
total: number           // calculado automáticamente con useEffect
selectedClient: any     // cliente seleccionado para la venta
```

**Operaciones:**
| Función | Comportamiento |
|---------|---------------|
| `addToCart(product, variant?)` | Incrementa cantidad si ya existe; valida que `stock > 0`; no supera el stock disponible |
| `updateQuantity(id, qty, variantId?)` | Si qty ≤ 0 elimina el item; la cantidad se clampea entre 0 y stock |
| `removeFromCart(id, variantId?)` | Elimina el item por id + variantId |
| `clearCart()` | Vacía items y selectedClient |

**Soporte de variantes:** Cada item se identifica por la combinación `id + variantId`.

**Hook de consumo:** `useCart()`

---

### CurrencyContext (`src/context/CurrencyContext.tsx`)

Maneja la conversión entre USD y VES con la tasa BCV en tiempo real.

**Estado:**
```ts
currency: 'USD' | 'VES'   // preferencia guardada en localStorage
exchangeRate: number        // tasa BCV (default fallback: 480.50)
isLoading: boolean
```

**Inicialización:** Lee `localStorage.getItem('app-currency')` al montar y llama a `/api/bcv`.

**Funciones:**
```ts
toggleCurrency()                          // Alterna USD↔VES + guarda en localStorage + toast
setCurrency(c: Currency)                  // Setea moneda directamente
formatPrice(amount, forceCurrency?)       // Formatea con Intl.NumberFormat (VES: "Bs. X,XX")
toUSD(amount, fromCurrency?)              // Convierte cualquier monto a USD
fromUSD(amount, toCurrency?)              // Convierte de USD a la moneda activa
```

**Hook de consumo:** `useCurrency()`

---

### ThemeContext (`src/context/ThemeContext.tsx`)

Wrapper sobre `next-themes`. Soporta: `light`, `dark`, `system`.

```ts
isDarkTheme: boolean    // true si el tema activo es dark
toggleTheme: () => void // alterna light↔dark
```

Usa `attribute="class"` (Tailwind dark mode). Aplica `suppressHydrationWarning` en `<html>` para evitar mismatch SSR.

**Hook de consumo:** `useAppTheme()`

---

## 7. Capa de Servicios (Firestore)

Todos los servicios importan `{ db }` desde `firebaseConfig.ts`. Usan el patrón de objeto con métodos estáticos.

### UserService (`src/services/user.service.ts`)

Colección: `users`

| Método | Tipo | Descripción |
|--------|------|-------------|
| `syncUserMetadata(uid, data)` | `setDoc` merge | Crea o actualiza metadata de usuario |
| `getUserById(uid)` | `getDoc` | Fetch único por ID |
| `getUsers()` | `getDocs` | Todos los usuarios ordenados por `createdAt desc` |
| `subscribeToUsers(cb)` | `onSnapshot` | Suscripción real-time a todos los usuarios |
| `updateUser(uid, updates)` | `updateDoc` | Actualiza campos parciales |
| `getTeamMembers(ownerId)` | `getDocs` + `where` | Staff donde `ownerId == ownerId` |
| `subscribeToTeam(ownerId, cb)` | `onSnapshot` + `where` | Real-time del equipo de un owner |
| `deleteUserMetadata(uid)` | `deleteDoc` | Elimina doc (no elimina de Firebase Auth) |

---

### ProductService (`src/services/product.service.ts`)

Colección: `products`

| Método | Tipo | Descripción |
|--------|------|-------------|
| `addProduct(product)` | `addDoc` | Crea producto con `createdAt/updatedAt` |
| `updateProduct(id, updates)` | `updateDoc` | Actualización parcial |
| `deleteProduct(id)` | `deleteDoc` | Elimina producto |
| `subscribeToProducts(cb)` | `onSnapshot` | Real-time, ordenado por `name` |
| `getProducts()` | `getDocs` | Fetch único, ordenado por `name` |
| `adjustStock(id, adjustment, reason, notes?)` | `runTransaction` | **Atómico:** actualiza stock + registra `stock_movements` |

**Detalle de `adjustStock`:**
1. Lee el producto dentro de la transacción
2. Calcula `newStock = stock + adjustment` (negativo = reducción)
3. Escribe en `products/{id}` el nuevo stock
4. Escribe en `stock_movements/{newId}` el movimiento con `{ productId, productName, adjustment, reason, notes, createdAt }`

---

### SalesService (`src/services/sales.service.ts`)

Colección: `sales`

| Método | Tipo | Descripción |
|--------|------|-------------|
| `createSale(sale, creator?)` | `runTransaction` | Crea venta y descuenta stock (ver flujo abajo) |
| `getPendingSales()` | `getDocs` + `where('status','pending')` | Ventas pendientes de cobro |
| `getDailySales(start, end)` | `getDocs` + `where createdAt between` | Ventas de un rango de tiempo |
| `getSaleById(id)` | `getDocs` + `where __name__` | Fetch de venta por ID |
| `getSalesByClient(clientId)` | `getDocs` + `where` | Historial de un cliente |
| `getAllSales()` | `getDocs` | Todas las ventas (reportes) |
| `updateSaleStatus(saleId, updates)` | `updateDoc` | Actualiza status + `paidAt` si es paid |
| `payAllDebts(clientId, updates)` | `updateDoc` batch | Marca como pagadas todas las deudas de un cliente |
| `paySpecificDebts(saleIds, updates)` | `Promise.all(updateDoc)` | Marca como pagadas ventas específicas |
| `subscribeToPendingSales(cb)` | `onSnapshot` + `where` | Real-time de cobranzas |
| `cancelSale(saleId, reason)` | `runTransaction` | Cancela venta y **restaura stock** |

**Flujo de `createSale` (transacción atómica):**
```
1. READS: Obtiene todos los documentos de productos en paralelo
2. VALIDATE: Verifica que el stock sea suficiente para cada item
   → Si falla: lanza error con el nombre del producto
3. WRITES:
   a. Actualiza stock de cada producto (stock - quantity)
   b. Crea el documento de venta en sales/{newId}
      - status: 'paid' si paymentMethod !== 'credit', 'pending' si es crédito
      - paidAt: Date.now() si es paid, null si es pending
      - cashboxId/cashboxName: solo si es paid
      - Sanitiza undefined de items antes de escribir
```

**Flujo de `cancelSale` (transacción atómica):**
```
1. Lee la venta y verifica que no esté ya cancelada
2. Lee todos los productos de los items
3. Restaura el stock (stock + quantity) para cada producto
4. Actualiza la venta: status='cancelled', cancellationReason, cancelledAt
```

---

### ClientService (`src/services/client.service.ts`)

Colección: `clients`

| Método | Tipo | Descripción |
|--------|------|-------------|
| `addClient(client)` | `addDoc` | Crea cliente |
| `updateClient(id, updates)` | `updateDoc` | Actualización parcial |
| `deleteClient(id)` | `deleteDoc` | Elimina cliente |
| `getClientById(id)` | `getDoc` | Fetch único |
| `subscribeToClients(cb)` | `onSnapshot` | Real-time, ordenado por `name` |

---

### CategoryService (`src/services/category.service.ts`)

Colección: `categories`

| Método | Descripción |
|--------|-------------|
| `addCategory(cat)` | Crea categoría |
| `updateCategory(id, updates)` | Actualiza |
| `deleteCategory(id)` | Elimina |
| `subscribeToCategories(cb)` | Real-time ordenado por `name` |
| `getCategories()` | Fetch único ordenado por `name` |

Soporte de subcategorías mediante el campo `parentId` (referencia a otra categoría).

---

### CashboxService (`src/services/cashbox.service.ts`)

Colección: `cashboxes`

Gestiona las cajas registradoras/puntos de cobro.

| Método | Descripción |
|--------|-------------|
| `addCashbox(name)` | Crea caja con `active: true` |
| `updateCashbox(id, updates)` | Actualiza |
| `deleteCashbox(id)` | Elimina |
| `getCashboxes()` | Fetch único ordenado por `createdAt desc` |
| `subscribeToCashboxes(cb)` | Real-time |

---

### ActivityService (`src/services/activity.service.ts`)

Colección: `admin_activities`

Log de auditoría para acciones administrativas.

| Método | Descripción |
|--------|-------------|
| `logAction(log)` | Registra acción con `createdAt: Date.now()` |
| `getAllActivities()` | Fetch global ordenado por `createdAt desc` |
| `getUserHistory(userId)` | Acciones relacionadas a un `targetUserId` específico |
| `subscribeToGlobalLog(cb)` | Real-time de todo el log |

**Acciones registradas:** `user_created`, `user_deleted`, `user_status_changed`, `subscription_extended`, `data_wipe`

---

### ConfigService (`src/services/config.service.ts`)

Colección: `app_config` / Documento: `version`

```ts
subscribeToVersion(callback: (latestVersion: string) => void)
// Escucha cambios en app_config/version.latest
// Retorna unsubscribe function
```

---

### DataManager (`src/services/DataManager.ts`)

Herramienta de wipe de base de datos. Solo usable por AdminGod.

**`wipeDatabase(adminGodId: string)`:**
- Elimina documentos de: `sales`, `products`, `clients`, `users`
- **Excluye** al adminGod actual usando el parámetro `adminGodId`
- Usa `writeBatch` con límite de 400 docs por batch (límite Firestore: 500)
- Itera en múltiples batches si hay más de 400 documentos

---

## 8. Esquema de Firestore

### Colección: `users`

```ts
{
  id: string;              // Firebase Auth UID (= document ID)
  email: string;
  displayName: string;
  role: 'admingod' | 'admin' | 'owner' | 'staff';
  active: boolean;
  ownerId?: string;        // Para staff: UID del owner al que pertenece
                           // Para owner: su propio UID
  createdAt: number;       // Unix timestamp (ms)
  updatedAt?: number;
  subscriptionEndsAt?: number;  // Unix timestamp (ms) — solo owners
  subscriptionPrice?: number;   // Solo owners
}
```

### Colección: `products`

```ts
{
  id: string;              // Firestore auto-ID
  name: string;
  price: number;           // Precio base en USD
  stock: number;
  minStockAlert: number;   // Umbral de alerta de stock bajo
  imageUrl?: string;       // URL en Firebase Storage
  description?: string;
  category?: string;       // Nombre de categoría
  subCategory?: string;
  unit?: string;           // "kg", "unidad", "litro", etc.
  tags?: string[];
  location?: string;       // ID de ubicación/sucursal
  variants?: ProductVariant[];
  createdAt: number;
  updatedAt: number;
}

// ProductVariant (embebido en products)
{
  id: string;
  name: string;
  stock: number;
  priceModifier?: number;  // Modificador sobre el precio base
  sku?: string;
}
```

### Colección: `sales`

```ts
{
  id?: string;             // Firestore auto-ID
  items: CartItem[];       // Snapshot de los productos vendidos
  total: number;           // Total en USD
  paymentMethod: 'cash' | 'transfer' | 'mobile_pay' | 'credit';
  clientId?: string | null;
  clientName?: string | null;
  createdAt: number;
  paidAt?: number | null;          // timestamp cuando se pagó
  status: 'paid' | 'pending' | 'cancelled';
  createdBy?: string | null;       // UID del cajero
  creatorName?: string | null;     // Nombre del cajero
  cancellationReason?: string;
  cancelledAt?: number;
  evidenceUrl?: string | null;     // Comprobante de pago
  paymentData?: {
    reference?: string;
    bank?: string;
    date?: string;
  };
  notes?: string;
  cashboxId?: string | null;       // ID de caja (solo si paid)
  cashboxName?: string | null;
}
```

### Colección: `clients`

```ts
{
  id: string;              // Firestore auto-ID
  name: string;
  phone?: string;
  notes?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### Colección: `categories`

```ts
{
  id: string;
  name: string;
  description?: string;
  parentId?: string;       // ID de categoría padre (para subcategorías)
  createdAt: number;
  updatedAt: number;
}
```

### Colección: `cashboxes`

```ts
{
  id: string;
  name: string;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
}
```

### Colección: `locations`

```ts
{
  id: string;
  name: string;
  active: boolean;
  createdAt: number;
}
```

### Colección: `stock_movements`

```ts
{
  id: string;              // Firestore auto-ID
  productId: string;
  productName: string;
  adjustment: number;      // Positivo = entrada, negativo = salida
  reason: 'restock' | 'waste' | 'correction';
  notes?: string;
  createdAt: number;
}
```

### Colección: `admin_activities`

```ts
{
  id: string;
  action: 'user_created' | 'user_deleted' | 'user_status_changed' | 'subscription_extended' | 'data_wipe';
  targetUserId?: string;
  targetUserName?: string;
  adminId: string;         // UID del admin que ejecutó la acción
  adminName: string;
  details: string;         // Descripción legible
  metadata?: any;          // Datos adicionales
  createdAt: number;
}
```

### Colección: `app_config`

```ts
// Documento: "version"
{
  latest: string;          // ej: "1.0.2" — se compara con APP_VERSION del cliente
}
```

---

## 9. Tipos TypeScript

### `UserProfile` (auth.ts)

```ts
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admingod' | 'admin' | 'owner' | 'staff';
  ownerId?: string;
  createdAt: number;
  subscriptionEndsAt?: number;
}
```

### `Product` + `ProductVariant` (inventory.ts)

```ts
interface Product {
  id: string;
  name: string;
  price: number;           // USD
  stock: number;
  minStockAlert: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  unit?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  variants?: ProductVariant[];
  location?: string;
}

interface ProductVariant {
  id: string;
  name: string;
  stock: number;
  priceModifier?: number;
  sku?: string;
}
```

### `Sale` + `CartItem` + `PromoRule` (sales.ts)

```ts
interface CartItem extends Product {
  quantity: number;
  variantId?: string;
  variantName?: string;
  finalPrice: number;      // Precio tras promos
  discountApplied?: string;
}

interface PromoRule {
  id: string;
  name: string;
  condition: (cart: CartItem[], paymentMethod: string) => boolean;
  effect: (cart: CartItem[]) => CartItem[];
  description: string;
}

interface Sale {
  id?: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'mobile_pay' | 'credit';
  clientId?: string | null;
  clientName?: string | null;
  createdAt: number;
  paidAt?: number | null;
  status: 'paid' | 'pending' | 'cancelled';
  createdBy?: string | null;
  creatorName?: string | null;
  cancellationReason?: string;
  cancelledAt?: number;
  evidenceUrl?: string | null;
  paymentData?: { reference?: string; bank?: string; date?: string; };
  notes?: string;
  cashboxId?: string | null;
  cashboxName?: string | null;
}
```

### `ActivityLog` (activity.ts)

```ts
interface ActivityLog {
  id: string;
  action: 'user_created' | 'user_deleted' | 'user_status_changed' | 'subscription_extended' | 'data_wipe';
  targetUserId?: string;
  targetUserName?: string;
  adminId: string;
  adminName: string;
  details: string;
  metadata?: any;
  createdAt: number;
}
```

---

## 10. Módulos de la Aplicación (Páginas)

### Redirección Home (`/`)

```tsx
// src/app/page.tsx
if (user.role === 'admingod' || user.role === 'admin') → /admin/dashboard
else → /pos
```

Muestra una pantalla de carga mientras espera al usuario de AuthContext.

---

### Autenticación (`/auth/*`)

| Ruta | Funcionalidad |
|------|--------------|
| `/auth/login` | Email + password con Firebase Auth; manejo de errores en español |
| `/auth/register` | Registro de nuevos owners |
| `/auth/reset-password` | Recuperación de contraseña vía email |

AppLayout detecta que la ruta empieza con `/auth` y renderiza solo el `children` sin sidebar ni nav.

---

### Punto de Venta (`/pos`)

- Catálogo de productos en tiempo real (`subscribeToProducts`)
- Búsqueda en tiempo real (client-side filter)
- Filtro por categoría con íconos visuales
- Carrito lateral/modal (`CartContext`)
- Selector de cliente (`ClientService.subscribeToClients`)
- Selector de caja (`CashboxService.subscribeToCashboxes`)
- Métodos de pago: `cash`, `transfer`, `mobile_pay`, `credit`
- Para pagos no-cash: captura de referencia, banco y fecha (`paymentData`)
- Soporte de variantes de producto
- Botón en bottom nav: si ya estás en `/pos`, abre/cierra el carrito (custom event `toggle-cart`)
- Checkout llama a `SalesService.createSale()` con la info del creator actual

---

### Inventario (`/inventory`)

- CRUD de productos con modal de formulario
- Upload de imagen a Firebase Storage
- Ajuste de stock con motivo (`restock`, `waste`, `correction`) via `ProductService.adjustStock`
- Filtros: por categoría, por stock bajo (`stock <= minStockAlert`), por búsqueda de texto
- Gestión de categorías (`CategoryService`) con modal propio (`CategoryModal`)
- Gestión de ubicaciones (`LocationService`)
- Gestión de cajas (`CashboxService`)
- Soporte de variantes de producto
- Suscripción real-time al catálogo

---

### Clientes (`/clients`)

- Lista con suscripción real-time (`ClientService.subscribeToClients`)
- Búsqueda client-side por nombre/teléfono
- CRUD con modal de formulario
- Integración con Contact Picker API (`useContactPicker`) para poblar nombre y teléfono desde contactos del dispositivo

**Detalle de cliente (`/clients/[clientId]`):**
- Fetch de datos del cliente (`ClientService.getClientById`)
- Historial de compras (`SalesService.getSalesByClient`)
- Resumen de deuda pendiente

---

### Cobranzas (`/collections`)

- Suscripción real-time a ventas pendientes (`SalesService.subscribeToPendingSales`)
- Agrupación de deudas por cliente
- Ordenamiento por monto de deuda o fecha
- Pago total de deudas de un cliente (`SalesService.payAllDebts`)
- Pago selectivo de ventas específicas (`SalesService.paySpecificDebts`)
- Botón WhatsApp: abre `https://wa.me/{phone}?text={mensaje}` con mensaje pre-armado
- Botón copiar al portapapeles del mensaje de recordatorio
- Badge en nav con el count de clientes con deuda pendiente

---

### Reportes (`/reports`)

- Fetch de todas las ventas (`SalesService.getAllSales`)
- Filtros de tiempo: últimos 7 días, 30 días, o todo el historial
- Métricas calculadas:
  - Total recaudado (paid)
  - Total pendiente (pending)
  - Cantidad de transacciones
  - Ticket promedio
  - Distribución por método de pago
- Gráficas (Recharts): `LineChart` para tendencia temporal, `PieChart` para métodos de pago
- Exportar Excel: genera un `.xlsx` con XLSX library
- Exportar PDF: genera con jsPDF + AutoTable
- Filtro por cajero (vendedor)

---

### Equipo (`/team`)

- Suscripción real-time al equipo del owner (`UserService.subscribeToTeam(user.ownerId)`)
- Formulario para crear nuevo staff (email + contraseña + nombre)
- Eliminación de staff con confirmación por input de texto (escribe el nombre para confirmar)
- Staff creado se asocia al `ownerId` del owner actual
- Al crear: se usa Firebase Auth para crear el usuario + `UserService.syncUserMetadata` para guardar el rol `staff`

---

### Configuración (`/settings`)

- Toggle de tema claro/oscuro (`useAppTheme`)
- Toggle de moneda USD/VES (`useCurrency`)
- Muestra versión de la app (`APP_VERSION`)
- Botón de cerrar sesión

---

### Panel Admin (`/admin/*`)

Acceso exclusivo para roles `admingod` y `admin`.

**Dashboard (`/admin/dashboard`):**
- Métricas globales de la plataforma
- Lista de todos los usuarios (`UserService.subscribeToUsers`)
- Acciones: activar/desactivar usuarios, extender suscripciones
- Registro de actividades recientes
- Solo AdminGod: botón de wipe de base de datos (`DataManager.wipeDatabase`)

**Usuarios (`/admin/users` y `/admin/users/[userId]`):**
- Lista completa de usuarios de la plataforma
- Vista detallada por usuario con historial de actividades (`ActivityService.getUserHistory`)
- Gestión de suscripción: fecha de vencimiento y precio
- Cambio de estado activo/inactivo

**Historial (`/admin/activities`):**
- Log global de actividades administrativas (`ActivityService.subscribeToGlobalLog`)
- Filtros por tipo de acción y rango de tiempo

---

## 11. Layout y Navegación

### AppLayout (`src/components/layout/AppLayout.tsx`)

Componente que envuelve todas las páginas (excepto `/auth/*`).

**Responsabilidades:**
1. **Redirección:** Si `!isLoading && !user && !isAuthRoute` → push a `/auth/login`
2. **Navegación dinámica por rol:**

| Rol | Items de navegación |
|-----|-------------------|
| `admingod` / `admin` | Control, Usuarios, Historial |
| `staff` | Venta, Inventario, Cobranzas, Clientes |
| `owner` | Venta, Inventario, Clientes, Reportes, Administración, Cobranzas |

3. **Desktop:** Sidebar flotante tipo "pill" a la izquierda (solo íconos + tooltip hover)
4. **Mobile:** Bottom nav flotante tipo "pill" en la parte inferior

**Funcionalidades del header:**
- Botón toggle de moneda: muestra la tasa BCV actual
- Botón carrito: muestra el count de items; si estás en `/pos` dispara `toggle-cart` custom event
- Botón notificaciones: dropdown con:
  - Alerta de suscripción por vencer (si quedan ≤ 7 días)
  - Alerta de cobros pendientes (con link a `/collections`)
- Pill de rol: muestra el rol del usuario con un punto de color

**Badges en nav:**
- `Venta`: muestra count de items en carrito
- `Cobranzas`: muestra count de clientes con deuda pendiente (red badge)

**Título de página:** Extrae el nombre del item de nav activo y lo muestra como `<h2>` grande.

---

## 12. API Routes (Backend)

### GET `/api/bcv`

Obtiene la tasa oficial USD→VES del BCV con caché de 1 hora.

**Estrategia de fallback (3 niveles):**

```
1. Intenta: GET https://ve.dolarapi.com/v1/dolares/oficial
   → Si ok: devuelve data.promedio (source: 'dolarapi')
   
2. Fallback: Scraping de https://www.bcv.org.ve/
   → Timeout de 8 segundos (AbortController)
   → Regex: /id="dolar"[\s\S]*?<strong>([\d,.]+)<\/strong>/i
   → Parsea el número reemplazando ',' por '.'
   → (source: 'scraping')
   
3. Fallback final: rate hardcodeado = 480.50
   → Responde con status 200 para no romper la app
   → Incluye campo 'error' en la respuesta
```

**Respuesta:**
```json
{
  "rate": 92.50,
  "date": "2025-01-15T...",
  "source": "dolarapi" | "scraping"
}
```

---

## 13. Sistema de Autenticación y Roles

### Jerarquía de Roles

```
admingod
  └── Acceso total a la plataforma
  └── Puede wipe la base de datos
  └── Ve métricas globales
  
admin
  └── Ve métricas globales
  └── Gestiona usuarios y suscripciones
  └── NO puede hacer wipe
  
owner
  └── Gestiona su negocio completo
  └── Tiene suscripción mensual
  └── Crea y gestiona staff
  
staff
  └── Acceso limitado: POS, inventario, clientes, cobranzas
  └── Vinculado a un owner via ownerId
  └── Si owner expira/inactivo → se desloguea automáticamente
```

### Validaciones en AuthContext (en orden)

1. `meta.active === false` → signOut
2. `meta.role === 'staff'` → verifica owner: `owner.active && !owner.subscriptionEndsAt < now` → si falla: signOut
3. `meta.role === 'owner' && subscriptionEndsAt < now` → signOut
4. En todos los demás casos → setea `UserProfile` en estado

### Protección de Rutas

- AppLayout verifica `!isLoading && !user` → redirect a `/auth/login`
- Las páginas de admin verifican internamente `user.role` para mostrar funcionalidades
- No hay middleware de Next.js para rutas; la protección es client-side

---

## 14. Flujo de Venta (POS)

```
Usuario selecciona productos
        ↓
CartContext.addToCart(product, variant?)
  - Verifica stock disponible
  - No permite superar el stock
        ↓
Usuario selecciona cliente (opcional) y caja
        ↓
Usuario elige método de pago
  - cash / transfer / mobile_pay → status: 'paid'
  - credit → status: 'pending' (crea deuda)
        ↓
Si transfer/mobile_pay: captura referencia, banco, fecha
        ↓
SalesService.createSale(cartItems, saleData, creator)
        ↓
  runTransaction() {
    1. Lee todos los productos del carrito
    2. Valida stock de cada uno
    3. Si hay insuficiente → throw Error (aborta todo)
    4. Descuenta stock de cada producto
    5. Crea documento en sales/{id}
       - items: sanitizados (sin undefined)
       - status: 'paid' | 'pending'
       - cashboxId/cashboxName: solo si paid
       - paidAt: Date.now() si paid, null si pending
  }
        ↓
CartContext.clearCart()
        ↓
Toast de confirmación
        ↓
Si credit → aparece en /collections
Si paid → aparece en /reports
```

---

## 15. Sistema de Moneda (USD/VES)

- **Almacenamiento:** Todos los precios en Firestore están en **USD**
- **Conversión:** Se realiza en cliente con la tasa BCV del `CurrencyContext`
- **Persistencia:** Preferencia guardada en `localStorage` como `app-currency`
- **Tasa:** Obtenida de `/api/bcv` al montar `CurrencyProvider`; se cachea en memoria durante la sesión
- **Fallback:** Si la API falla, se usa `480.50` como tasa hardcodeada

**Formato de precio VES:**
```ts
// Usa Intl.NumberFormat con 'es-VE' y reemplaza 'VES' por 'Bs.'
"Bs. 9,234.50"
```

**Formato de precio USD:**
```ts
// Usa Intl.NumberFormat con 'en-US'
"$123.45"
```

---

## 16. Sistema de Actualizaciones PWA

**UpdateDetector (`src/components/common/UpdateDetector.tsx`)**

Funciona mediante suscripción real-time a Firestore:

```
ConfigService.subscribeToVersion() escucha app_config/version.latest
        ↓
Si latestVersion !== APP_VERSION (del config/version.ts)
        ↓
1. signOut() automático (previene corrupción de estado)
2. Muestra modal de actualización a pantalla completa
3. Inicia countdown de 15 segundos con barra de progreso
4. Al llegar a 0 (o si el usuario hace clic):
   - localStorage.clear()
   - sessionStorage.clear()
   - window.location.reload() (fuerza recarga desde servidor)
```

Para publicar una actualización: cambiar `APP_VERSION` en `config/version.ts` **y** actualizar `app_config/version.latest` en Firestore al mismo valor.

---

## 17. Integraciones Externas

### BCV (Banco Central de Venezuela)
- **Primary:** `https://ve.dolarapi.com/v1/dolares/oficial`
- **Fallback:** Scraping de `https://www.bcv.org.ve/`
- **Caché:** `next: { revalidate: 3600 }` (1 hora en Next.js cache)

### WhatsApp Web
- URL: `https://wa.me/{phone}?text={encodedMessage}`
- Usado en `/collections` para enviar recordatorios de cobro
- El mensaje es pre-armado con el nombre del cliente y el monto de deuda

### Firebase Cloud Storage
- Almacenamiento de imágenes de productos
- La URL pública se guarda en `products/{id}.imageUrl`

### Contact Picker API (`useContactPicker.ts`)
- API nativa del navegador (solo mobile Chrome/Android)
- Detección de soporte: `'contacts' in navigator && 'select' in navigator.contacts`
- Solicita campos: `['name', 'tel']`
- Limpia el teléfono: `phone.replace(/[^\d+]/g, '')` (solo dígitos y `+`)
- Si el usuario cancela → `AbortError` silencioso

---

## 18. Componentes Compartidos

### `src/components/ui/`

Componentes base reutilizables en toda la aplicación:
- `Button` — variantes: `primary`, `secondary`, `danger`, etc.; prop `isLoading` con spinner
- `Input` — input estilizado con clases Tailwind
- `Card` — contenedor con estilos de la UI
- `Select` — select estilizado

### `src/components/inventory/CategoryModal.tsx`

Modal para crear/editar categorías. Usa `CategoryService`.

### `src/components/common/UpdateDetector.tsx`

Ver [sección 16](#16-sistema-de-actualizaciones-pwa).

---

## 19. Variables de Entorno

Todas son públicas (`NEXT_PUBLIC_`) porque Firebase se inicializa en el cliente.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

No hay variables de servidor privadas. La seguridad de datos depende de **Firebase Security Rules** configuradas en la consola de Firebase (no visibles en el código del repo).

---

*Generado el 2026-04-26 — Cuadra v1.0.1*

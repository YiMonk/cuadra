# Plan de Migración: Firebase → Neon PostgreSQL + Separación Frontend/Backend

## Estructura objetivo

```
~/Documentos/
├── cuadra-frontend/    (Next.js 15 — App Router)
└── cuadra-backend/     (Node.js + Express + Prisma + Neon)
```

---

## FASE 1 — Crear cuadra-backend

### 1.1 Setup inicial del proyecto
- [ ] Crear carpeta `cuadra-backend/` fuera del repo actual
- [ ] `npm init -y` + configurar TypeScript (`tsconfig.json`)
- [ ] Instalar dependencias: `express`, `@prisma/client`, `prisma`, `jsonwebtoken`, `bcrypt`, `cors`, `dotenv`, `zod`
- [ ] Instalar devDependencies: `tsx`, `@types/express`, `@types/jsonwebtoken`, `@types/bcrypt`
- [ ] Crear `src/index.ts` con servidor Express base
- [ ] Crear `.env` con `DATABASE_URL` y `JWT_SECRET` (ver `docs/.env.backend.example`)
- [ ] Configurar `git init` + `.gitignore` (excluir `.env`, `node_modules`, `dist`)

### 1.2 Base de datos — Neon + Prisma
- [ ] Crear proyecto en [neon.tech](https://neon.tech) (free tier)
- [ ] Copiar `DATABASE_URL` al `.env`
- [ ] Crear `prisma/schema.prisma` con los modelos equivalentes a las colecciones Firestore:

| Colección Firestore | Tabla Prisma |
|---|---|
| `users` | `User` |
| `products` | `Product` |
| `sales` | `Sale` + `SaleItem` |
| `clients` | `Client` |
| `expenses` | `Expense` |
| `cashboxes` | `Cashbox` |
| `cash_sessions` | `CashSession` |
| `locations` | `Location` |
| `suppliers` | `Supplier` |
| `stock_transfers` | `StockTransfer` |
| `promotions` | `Promotion` |
| `categories` | `Category` |
| `activities` | `Activity` |

- [ ] `npx prisma migrate dev --name init` — generar tablas
- [ ] `npx prisma generate` — generar client tipado

### 1.3 Autenticación JWT
- [ ] Crear `src/middleware/auth.ts` — verificar JWT en header `Authorization: Bearer <token>`
- [ ] `POST /auth/login` — recibe `email + password`, devuelve JWT
- [ ] `POST /auth/logout` — invalida token (blacklist en memoria o Redis)
- [ ] `GET /auth/me` — devuelve perfil del usuario autenticado
- [ ] `POST /auth/register` — registro nuevo usuario owner

### 1.4 Módulos core (en este orden)
- [ ] `src/routes/users.ts` — CRUD usuarios + roles
- [ ] `src/routes/products.ts` — CRUD productos + variantes
- [ ] `src/routes/clients.ts` — CRUD clientes + deudas
- [ ] `src/routes/sales.ts` — CRUD ventas + items
- [ ] `src/routes/expenses.ts` — CRUD gastos
- [ ] `src/routes/cashboxes.ts` — CRUD cajas
- [ ] `src/routes/cash-sessions.ts` — apertura/cierre de sesiones
- [ ] `src/routes/locations.ts` — CRUD sucursales
- [ ] `src/routes/suppliers.ts` — CRUD proveedores
- [ ] `src/routes/stock-transfers.ts` — transferencias de stock
- [ ] `src/routes/promotions.ts` — CRUD promociones
- [ ] `src/routes/reports.ts` — endpoints de reportes (ventas, inventario, ganancias)
- [ ] `GET /bcv-rate` — reemplaza el `/api/bcv` actual del frontend

### 1.5 Deploy del backend
- [ ] Crear `Dockerfile` o configurar para Railway/Render
- [ ] Configurar variables de entorno en el panel del hosting
- [ ] Verificar que `DATABASE_URL` de Neon apunta al branch `main`
- [ ] Deploy inicial y test con Postman/Insomnia
- [ ] Guardar URL del backend: `https://cuadra-backend.railway.app`

---

## FASE 2 — Adaptar cuadra-frontend

### 2.1 Setup
- [ ] Crear `cuadra-frontend/` como copia del proyecto actual (sin `functions/`, sin `graphify-out/`)
- [ ] Agregar `NEXT_PUBLIC_API_URL` al `.env` (ver `docs/.env.frontend.example`)
- [ ] Crear `src/lib/api.ts` — fetch wrapper con base URL + auth header automático

```typescript
// src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('cuadra-token');
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
}
```

### 2.2 Reemplazar AuthContext
- [ ] Eliminar imports de `firebase/auth`
- [ ] `signIn` → `POST /auth/login`, guardar JWT en `localStorage`
- [ ] `signOut` → `POST /auth/logout`, limpiar JWT
- [ ] `onAuthStateChanged` → verificar JWT en localStorage al montar + `GET /auth/me`
- [ ] Mantener la misma interfaz `UserProfile` y el mismo `patchUser` pattern

### 2.3 Reemplazar servicios (15 archivos en `src/services/`)
Para cada `*.service.ts`:
- [ ] `product.service.ts` — reemplazar calls Firestore por `apiFetch('/products')`
- [ ] `client.service.ts`
- [ ] `sales.service.ts`
- [ ] `expense.service.ts`
- [ ] `cashbox.service.ts`
- [ ] `cashSession.service.ts`
- [ ] `cashClosing.service.ts`
- [ ] `location.service.ts`
- [ ] `supplier.service.ts`
- [ ] `user.service.ts`
- [ ] `activity.service.ts`
- [ ] `category.service.ts`
- [ ] `promotion.service.ts`
- [ ] `stockTransfer.service.ts`
- [ ] `storage.service.ts` — imágenes (usar S3/Cloudflare R2 o Firebase Storage por ahora)

### 2.4 Reemplazar onSnapshot por polling
Los 15 hooks que usan `onSnapshot` deben cambiar a:
- [ ] `useInventory.ts` → `useEffect` con fetch + `setInterval(30000)`
- [ ] `useSales.ts`
- [ ] `usePOSData.ts` (4 listeners → 4 fetch paralelos con `Promise.all`)
- [ ] `useClients.ts`
- [ ] `useCashboxes.ts`
- [ ] `useClosings.ts`
- [ ] `useSession.ts`
- [ ] `useTeam.ts`
- [ ] `useNotifications.ts`
- [ ] Resto de hooks con onSnapshot

### 2.5 Limpieza Firebase
- [ ] Eliminar `src/config/firebaseConfig.ts`
- [ ] Eliminar `firebase` del `package.json`
- [ ] Eliminar todos los `NEXT_PUBLIC_FIREBASE_*` del `.env`
- [ ] Eliminar `functions/` folder (ya no se necesita en el frontend repo)
- [ ] Eliminar `firebase.json`, `firestore.rules`, `firestore.indexes.json`
- [ ] `npm uninstall firebase`

### 2.6 Actualizar middleware
- [ ] `src/middleware.ts` — cambiar de cookie `cuadra-session` a verificar JWT en header/cookie

### 2.7 Deploy frontend en Vercel
- [ ] Actualizar env vars en Vercel: eliminar `NEXT_PUBLIC_FIREBASE_*`, agregar `NEXT_PUBLIC_API_URL`
- [ ] Autorizar dominio del frontend en el backend CORS config
- [ ] Build + deploy

---

## FASE 3 — Migración de datos

### 3.1 Exportar datos de Firestore
- [ ] Crear script `scripts/export-firestore.js` usando Firebase Admin SDK
- [ ] Exportar todas las colecciones a archivos JSON: `exports/users.json`, `exports/products.json`, etc.
- [ ] Verificar integridad: contar documentos exportados vs documentos en Firebase Console

### 3.2 Transformar y sembrar en Neon
- [ ] Crear `scripts/seed-neon.ts` usando Prisma Client
- [ ] Mapear campos Firestore (camelCase, timestamps como números) → campos Prisma (snake_case, `DateTime`)
- [ ] `npx tsx scripts/seed-neon.ts` — importar datos
- [ ] Verificar filas en Neon Console (Dashboard > Tables)

### 3.3 Verificación final
- [ ] Comparar conteos: registros en Firestore vs filas en Neon
- [ ] Test end-to-end en staging: login → ver inventario → crear venta → ver reportes
- [ ] Verificar que los `ownerId` (tenant IDs) se mantienen correctos

---

## FASE 4 — Cutover (go live)

- [ ] Apagar escrituras en Firebase (modo read-only en Firestore Rules)
- [ ] Hacer deploy del backend con datos de Neon
- [ ] Hacer deploy del frontend apuntando al nuevo backend
- [ ] Verificar que usuarios existentes pueden hacer login (contraseñas migradas o reset forzado)
- [ ] Monitorear logs del backend las primeras 24h
- [ ] Si todo OK: eliminar proyecto Firebase (o mantener solo Firebase Storage para imágenes)

---

## Notas técnicas

- **Realtime**: `onSnapshot` de Firestore no tiene equivalente directo en REST. El polling cada 30s es suficiente para un POS. Si se necesita realtime en el futuro, agregar WebSocket con `socket.io`.
- **Imágenes**: Firebase Storage puede mantenerse aunque se migre la DB. Alternativa: Cloudflare R2 (free hasta 10GB).
- **Multi-tenant**: El campo `ownerId` en cada tabla reemplaza la segmentación de Firestore. Todos los endpoints del backend deben filtrar por `req.user.ownerId`.
- **Firebase Functions**: El folder `functions/` tiene email notifications (nodemailer). Reemplazar por endpoints en el backend: `POST /notifications/email`.

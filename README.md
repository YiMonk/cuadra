# Cuadra — Tu Negocio, Bajo Control

POS moderno para comerciantes venezolanos. Ventas en USD y Bs con tasa BCV en tiempo real, inventario, cobranzas, reportes y multi-tenancy.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend | Firebase Cloud Functions (Node.js 20) |
| Base de datos | Cloud Firestore |
| Auth | Firebase Authentication + Custom Claims |
| PWA | `@ducanh2912/next-pwa` + Workbox |
| Deploy web | **Vercel** (recomendado) |
| Deploy backend | Firebase CLI |

---

## Arquitectura rápida

```
cuadra/
├── src/                  # Next.js — frontend completo
│   ├── app/              # Páginas (POS, inventario, reportes…)
│   ├── components/       # UI reutilizable
│   ├── services/         # Lógica Firestore (products, sales, clients…)
│   ├── context/          # AuthContext, BCVContext
│   └── types/            # Tipos TypeScript compartidos
├── functions/            # Cloud Functions — backend serverless
│   └── src/
│       ├── admin.ts      # wipeDatabase (solo admingod)
│       ├── team.ts       # createStaffMember / deleteStaffMember
│       └── onUserWrite.ts# syncUserClaims → JWT Custom Claims
├── firestore.rules       # Reglas de seguridad
├── firestore.indexes.json
└── firebase.json         # Config deploy Firebase (functions + rules)
```

---

## Variables de entorno

Crea `.env.local` en la raíz con tus credenciales de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
```

---

## Despliegue en Vercel (frontend)

Vercel detecta Next.js automáticamente. Solo necesitas:

1. **Conectar el repo** en [vercel.com](https://vercel.com) → New Project → importar este repositorio.
2. **Agregar variables de entorno** en Vercel dashboard → Settings → Environment Variables (las mismas del `.env.local`).
3. **Deploy** — Vercel corre `next build` en cada push a `main`.

> La carpeta `functions/` es ignorada por Vercel. Solo se despliega el frontend Next.js.

---

## Despliegue del backend (Firebase)

El backend (Cloud Functions, Firestore Rules e Indexes) se despliega por separado con Firebase CLI:

```bash
# Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# Login
firebase login

# Desplegar todo el backend
firebase deploy --only functions,firestore:rules,firestore:indexes
```

> **Importante:** Las `firestore.rules` usan JWT Custom Claims para autorización.
> La función `syncUserClaims` debe estar desplegada antes de activar las reglas,
> de lo contrario los usuarios no tendrán acceso.

### Deploy individual

```bash
firebase deploy --only functions          # solo Cloud Functions
firebase deploy --only firestore:rules    # solo reglas de seguridad
firebase deploy --only firestore:indexes  # solo índices
```

---

## Roles del sistema

| Rol | Permisos |
|---|---|
| `admingod` | Acceso total — panel maestro, wipeDatabase |
| `admin` | Gestión de owners, activar/desactivar cuentas |
| `owner` | Gestiona su propio negocio (productos, ventas, equipo) |
| `staff` | Opera el POS y el inventario bajo el owner asignado |

Los roles se asignan como JWT Custom Claims vía la función `syncUserClaims`.

---

## Módulos

- **POS** — Venta rápida con tasa BCV en tiempo real, métodos de pago múltiples
- **Inventario** — CRUD de productos, alertas de stock mínimo, soft-delete
- **Clientes** — Historial, cobranzas pendientes
- **Reportes** — Ventas, ingresos, exportación PDF/Excel
- **Configuración** — Gestión de equipo, ubicaciones, caja
- **Panel Admin** — Métricas globales, gestión de owners (solo admingod/admin)

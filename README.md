# Cuadra — Punto de Venta para Emprendedores

Cuadra es un SaaS de gestión comercial diseñado para pequeños y medianos negocios latinoamericanos. Permite manejar ventas, inventario, clientes, caja y reportes desde cualquier dispositivo.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4, PWA |
| Backend | FastAPI (Python 3.14), SQLAlchemy async, Alembic |
| Base de datos | PostgreSQL en Neon (prod) · SQLite (dev) |
| Auth | JWT propio — access token 24h + refresh 7d |
| Deploy | Vercel (frontend + backend) |

---

## Estructura del repo

```
cuadra/
├── Frontend/       # Next.js — interfaz web y PWA
├── Backend/        # FastAPI — API REST, lógica de negocio
└── openspec/       # Documentación de cambios y specs del proyecto
```

---

## Funcionalidades principales

- **POS** — punto de venta con múltiples métodos de pago y descuentos
- **Inventario** — productos, variantes, stock por ubicación, alertas de mínimo
- **Clientes** — historial de compras, deudas, cobros
- **Caja** — sesiones de caja, arqueos y cierres
- **Gastos** — registro de egresos por categoría
- **Reportes** — ventas, ingresos, productos más vendidos, tipo de cambio BCV
- **Equipo** — roles (owner, cashier, staff) con permisos diferenciados
- **Promociones** — descuentos por porcentaje, cupones, listas de precios

---

## Desarrollo local

### Backend
```bash
cd Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd Frontend
npm install
npm run dev        # corre en http://localhost:3000
```

El frontend apunta al backend vía `NEXT_PUBLIC_API_URL` en `Frontend/.env`.

### Variables de entorno

Copia `Backend/.env.example` a `Backend/.env` y completa los valores.  
Para producción, `DATABASE_URL` apunta a Neon y `NODE_ENV=production`.

---

## Tests

```bash
cd Backend
.venv/bin/python -m pytest tests/ -q
# 185 tests · todos deben pasar
```

---

## Deploy

Dos proyectos en Vercel apuntando al mismo repositorio:

- **Proyecto Frontend** — Root directory: `Frontend/` · Framework: Next.js
- **Proyecto Backend** — Root directory: `Backend/` · Framework: Other (Python)

La base de datos Neon se conecta desde el dashboard de Vercel (Storage → Connect Database) e inyecta `DATABASE_URL` automáticamente.

---

## Gestión de cambios

El proyecto usa [OpenSpec](openspec/) para documentar cada cambio antes de implementarlo.  
Los cambios activos están en `openspec/changes/`, los completados en `openspec/changes/archive/`.

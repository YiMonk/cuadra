# Cuadra — CLAUDE.md

POS y plataforma de gestión comercial (ventas, caja, inventario, clientes) para pequeños negocios venezolanos.

---

## Stack

| Capa      | Tecnología                                           |
| --------- | ---------------------------------------------------- |
| Frontend  | Next.js 16.1.6 + React 19 + TypeScript + Tailwind v4 |
| Backend   | Python FastAPI + SQLAlchemy 2 async + Alembic        |
| DB dev    | SQLite (aiosqlite)                                   |
| DB prod   | PostgreSQL en Neon (asyncpg)                         |
| Auth      | JWT access (24h) + refresh (7d), sin Firebase        |
| Deploy    | Vercel (frontend) — backend TBD                      |

**Firebase fue completamente removido el 2026-06-02.** Nunca re-importar Firebase SDK.

---

## Estructura del repositorio

```
cuadra/
├── Backend/                    ← FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py         ← engine async, get_db dependency
│   │   ├── deps.py             ← get_current_user, owner_id
│   │   ├── models/             ← SQLAlchemy ORM (user, product, sale, client…)
│   │   ├── schemas/            ← Pydantic request/response schemas
│   │   ├── services/           ← lógica de negocio
│   │   └── routers/            ← endpoints (auth, users, products, sales…)
│   ├── tests/                  ← 185 tests, pytest + AAA
│   ├── alembic/                ← migraciones (una sola: "init")
│   └── requirements.txt
├── Frontend/                   ← Next.js app
│   ├── src/
│   │   ├── app/                ← App Router (páginas y layouts)
│   │   ├── components/         ← componentes React reutilizables
│   │   ├── context/            ← AuthContext (JWT, sin Firebase)
│   │   ├── hooks/              ← custom hooks
│   │   ├── lib/
│   │   │   ├── api.ts          ← fetch wrapper con auto-refresh en 401
│   │   │   └── auth-tokens.ts  ← helpers localStorage tokens
│   │   ├── services/           ← llamadas al backend por dominio
│   │   └── types/              ← interfaces TypeScript
│   └── package.json
├── openspec/
│   ├── specs/                  ← specs maestras por dominio (17 dominios)
│   └── changes/                ← changes en progreso o completados
├── docs/
└── CLAUDE.md                   ← este archivo
```

---

## Patrones clave

- **Arquitectura**: API Route → Service → Repository → Database
- **Multi-tenancy**: todas las entidades tienen `owner_id`, filtrado via JWT
- **API calls en frontend**: usar siempre `api.get/post/patch/put/delete` de `@/lib/api`, nunca `fetch` directo
- **Styling**: Tailwind v4, sin SCSS ni CSS modules
- **Mobile**: backdrop-filter/blur DESHABILITADO en mobile (causa glitch de GPU)

---

## Comandos principales

```bash
# Backend
cd Backend
.venv/bin/python -m pytest tests/ --tb=short -q      # correr tests
.venv/bin/alembic upgrade head                        # aplicar migraciones
uvicorn app.main:app --reload --port 8000             # dev server

# Frontend
cd Frontend
pnpm run dev                                          # dev server (puerto 3000)
pnpm run build                                        # build de producción
npx tsc --noEmit                                      # type check
```

---

## Agentes disponibles

| Agente       | Modelo | Cuándo invocarlo                                                   |
| ------------ | ------ | ------------------------------------------------------------------ |
| `architect`  | Sonnet | Diseñar nueva feature, cambio de arquitectura, DB schema           |
| `backend`    | Haiku  | Escribir endpoint FastAPI, modelo ORM, migración, tests backend    |
| `frontend`   | Haiku  | Crear componente React, página Next.js, hook, integración con API  |
| `analyzer`   | Haiku  | Review de PR, análisis de cobertura, documentar en BrainTwo        |

---

## Skills (flujo OpenSpec)

| Skill              | Cuándo usarla                                                   |
| ------------------ | --------------------------------------------------------------- |
| `opsx-propose`     | Antes de empezar cualquier cambio no trivial — crea proposal, specs, tasks y nota en BrainTwo |
| `opsx-apply`       | Para iniciar la implementación de un change propuesto            |
| `opsx-archive`     | Al completar un change — cierra y archiva en BrainTwo            |
| `openspec-explore` | Para pensar en voz alta antes de proponer un change              |

---

## Obsidian — BrainTwo

Vault en `/home/yimonk/Documentos/BrainTwo/Cuadra/`:
- `Context.md` — estado macro del proyecto
- `Progress/Overview.md` — kanban de changes (propuesto / en progreso / bloqueado / completado)
- `Progress/<change>.md` — detalle de cada change
- `Specs/` — specs BDD por feature
- `Open Questions.md` — deuda técnica y preguntas abiertas

---

## Estado actual (2026-06-05)

- Backend: ✅ estable, 185 tests passing
- Frontend: 🔄 en curso, Firebase removido, build limpio
- DB prod (Neon): 🔴 bloqueado — puerto 5432 inaccesible desde red actual
- Deploy: ⏳ pendiente

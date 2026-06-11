from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, users, products, clients, locations, suppliers, categories, expenses, sales, companies
from app.routers.access_accounts import router as access_accounts_router
from app.routers.company_locations import router as company_locations_router
from app.routers.audit_log import router as audit_log_router
from app.routers.cashboxes import cashboxes_router, sessions_router
from app.routers import cash_closings, stock_transfers, returns, activity
from app.routers.promotions import promotions_router, price_lists_router, coupons_router
from app.routers.reports import router as reports_router, bcv_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as exc:
        print(f"[cuadra] DB init error: {type(exc).__name__}: {exc}", flush=True)
    yield
    await engine.dispose()


app = FastAPI(
    title="Cuadra API",
    version="1.0.0",
    description="Backend REST para Cuadra POS — multi-tenant, JWT",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(access_accounts_router)
app.include_router(company_locations_router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(clients.router)
app.include_router(locations.router)
app.include_router(suppliers.router)
app.include_router(categories.router)
app.include_router(expenses.router)
app.include_router(sales.router)
app.include_router(cashboxes_router)
app.include_router(sessions_router)
app.include_router(cash_closings.router)
app.include_router(stock_transfers.router)
app.include_router(returns.router)
app.include_router(activity.router)
app.include_router(promotions_router)
app.include_router(price_lists_router)
app.include_router(coupons_router)
app.include_router(reports_router)
app.include_router(bcv_router)
app.include_router(audit_log_router)


@app.get("/api/v1/health", tags=["meta"])
async def health():
    return {"status": "ok"}

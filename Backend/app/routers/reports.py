from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.expense import Expense
from app.models.product import Product
from app.models.sale import Sale, SaleItem

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

# Simple in-memory BCV cache
_bcv_cache: dict = {}


@router.get("/sales-summary")
async def sales_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    location_id: Optional[str] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Sale).where(Sale.owner_id == user.owner_id)
    if start_date:
        stmt = stmt.where(Sale.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Sale.created_at <= end_date)
    if location_id:
        stmt = stmt.where(Sale.cashbox_id == location_id)

    result = await db.execute(stmt)
    all_sales = result.scalars().all()

    paid = [s for s in all_sales if s.status == "paid"]
    pending = [s for s in all_sales if s.status == "pending"]
    revenue = round(sum(s.total for s in paid), 2)
    pending_amount = round(sum(s.total for s in pending), 2)
    count = len(paid)
    avg_ticket = round(revenue / count, 2) if count > 0 else 0

    return {
        "count": count,
        "revenue": revenue,
        "average_ticket": avg_ticket,
        "pending": pending_amount,
    }


@router.get("/inventory")
async def inventory_report(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.owner_id == user.owner_id, Product.active == True)
    )
    products = result.scalars().all()

    total_value = round(sum(
        (p.cost or 0) * p.stock for p in products if p.cost is not None
    ), 2)

    low_stock = [
        {"id": p.id, "name": p.name, "stock": p.stock}
        for p in products
        if p.min_stock is not None and p.stock <= p.min_stock
    ]

    return {
        "total_products": len(products),
        "low_stock_count": len(low_stock),
        "low_stock": low_stock,
        "total_inventory_value": total_value,
    }


@router.get("/profit")
async def profit_report(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Revenue from paid sales
    sale_stmt = select(Sale).where(Sale.owner_id == user.owner_id, Sale.status == "paid")
    if start_date:
        sale_stmt = sale_stmt.where(Sale.created_at >= start_date)
    if end_date:
        sale_stmt = sale_stmt.where(Sale.created_at <= end_date)
    sales_result = await db.execute(sale_stmt)
    paid_sales = sales_result.scalars().all()
    revenue = round(sum(s.total for s in paid_sales), 2)

    # Expenses
    exp_stmt = select(Expense).where(Expense.owner_id == user.owner_id)
    if start_date:
        exp_stmt = exp_stmt.where(Expense.paid_at >= start_date)
    if end_date:
        exp_stmt = exp_stmt.where(Expense.paid_at <= end_date)
    exp_result = await db.execute(exp_stmt)
    total_expenses = round(sum(e.amount for e in exp_result.scalars().all()), 2)

    # COGS: sum of cost * quantity for items in paid sales
    sale_ids = [s.id for s in paid_sales]
    cost_of_goods = 0.0
    if sale_ids:
        for sale_id in sale_ids:
            items_result = await db.execute(
                select(SaleItem).where(SaleItem.sale_id == sale_id)
            )
            for item in items_result.scalars().all():
                prod_result = await db.execute(
                    select(Product).where(Product.id == item.product_id)
                )
                prod = prod_result.scalar_one_or_none()
                if prod and prod.cost:
                    cost_of_goods += prod.cost * item.quantity
    cost_of_goods = round(cost_of_goods, 2)
    gross_profit = round(revenue - cost_of_goods, 2)
    net_profit = round(gross_profit - total_expenses, 2)

    return {
        "revenue": revenue,
        "expenses": total_expenses,
        "cost_of_goods": cost_of_goods,
        "gross_profit": gross_profit,
        "net_profit": net_profit,
    }


@router.get("/by-payment-method")
async def by_payment_method(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Sale).where(Sale.owner_id == user.owner_id, Sale.status == "paid")
    if start_date:
        stmt = stmt.where(Sale.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Sale.created_at <= end_date)
    result = await db.execute(stmt)
    sales = result.scalars().all()

    totals: dict = {"cash": 0.0, "transfer": 0.0, "mobile_pay": 0.0, "credit": 0.0}
    for s in sales:
        totals[s.payment_method] = round(totals.get(s.payment_method, 0) + s.total, 2)
    return totals


@router.get("/top-products")
async def top_products(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 10,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sale_stmt = select(Sale).where(Sale.owner_id == user.owner_id, Sale.status == "paid")
    if start_date:
        sale_stmt = sale_stmt.where(Sale.created_at >= start_date)
    if end_date:
        sale_stmt = sale_stmt.where(Sale.created_at <= end_date)
    sales_result = await db.execute(sale_stmt)
    paid_sales = sales_result.scalars().all()

    aggregated: dict = {}
    for sale in paid_sales:
        items_result = await db.execute(select(SaleItem).where(SaleItem.sale_id == sale.id))
        for item in items_result.scalars().all():
            if item.product_id not in aggregated:
                aggregated[item.product_id] = {
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "total_quantity": 0,
                    "total_revenue": 0.0,
                }
            aggregated[item.product_id]["total_quantity"] += item.quantity
            aggregated[item.product_id]["total_revenue"] += item.subtotal

    sorted_products = sorted(
        aggregated.values(), key=lambda x: x["total_quantity"], reverse=True
    )[:limit]
    for p in sorted_products:
        p["total_revenue"] = round(p["total_revenue"], 2)
    return sorted_products


# ── BCV Rate (no auth required) ───────────────────────────────────────────────

bcv_router = APIRouter(tags=["bcv"])


@bcv_router.get("/api/v1/bcv-rate")
async def bcv_rate():
    from datetime import timedelta
    import asyncio

    now = datetime.now(timezone.utc)
    cached = _bcv_cache.get("data")
    if cached and (now - cached["fetched_at"]) < timedelta(minutes=30):
        return {**cached, "cached": True}

    try:
        # Try to fetch BCV rate (simplified — real impl would scrape bcv.org.ve)
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://www.bcv.org.ve/")
            # Parse the rate from the page (simplified for now)
            import re
            match = re.search(r'USD.*?(\d+[,\.]\d+)', resp.text)
            if match:
                rate_str = match.group(1).replace(",", ".")
                rate = float(rate_str)
            else:
                raise ValueError("rate not found")

        data = {"rate": rate, "fetched_at": now, "cached": False}
        _bcv_cache["data"] = {**data, "fetched_at": now}
        return data

    except Exception:
        if cached:
            return {**cached, "cached": True}
        from fastapi import HTTPException
        raise HTTPException(status_code=502, detail="no se pudo obtener la tasa BCV")

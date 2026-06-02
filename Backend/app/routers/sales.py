from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.client import Client
from app.models.product import Product, StockMovement
from app.models.sale import Sale, SaleItem
from app.schemas.sales import (
    CancelRequest,
    PayAllDebtsRequest,
    SaleCreate,
    SaleResponse,
    SaleStatusUpdate,
)

router = APIRouter(prefix="/api/v1/sales", tags=["sales"])


async def _load_sale_with_items(sale: Sale, db: AsyncSession) -> Sale:
    result = await db.execute(select(SaleItem).where(SaleItem.sale_id == sale.id))
    sale.items = result.scalars().all()
    return sale


async def _get_sale_or_404(sale_id: str, owner_id: str, db: AsyncSession) -> Sale:
    result = await db.execute(
        select(Sale).where(Sale.id == sale_id, Sale.owner_id == owner_id)
    )
    sale = result.scalar_one_or_none()
    if sale is None:
        raise HTTPException(status_code=404, detail="venta no encontrada")
    return sale


@router.post("", response_model=SaleResponse, status_code=201)
async def create_sale(
    body: SaleCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.items:
        raise HTTPException(status_code=400, detail="la venta debe tener al menos un producto")

    # Load and validate all products atomically
    products: dict[str, Product] = {}
    for item in body.items:
        if item.product_id in products:
            continue
        result = await db.execute(
            select(Product).where(
                Product.id == item.product_id,
                Product.owner_id == user.owner_id,
                Product.active == True,
            )
        )
        prod = result.scalar_one_or_none()
        if prod is None:
            raise HTTPException(status_code=404, detail=f"producto {item.product_id} no encontrado")
        products[item.product_id] = prod

    # Check stock for all items first (before mutating anything)
    for item in body.items:
        prod = products[item.product_id]
        if prod.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"stock insuficiente para {prod.name}",
            )

    # Determine status
    status = "pending" if body.payment_method == "credit" else "paid"
    paid_at = datetime.now(timezone.utc) if status == "paid" else None

    total = sum(item.quantity * item.unit_price for item in body.items)
    if body.discount:
        total -= body.discount
    total = round(total, 2)

    sale = Sale(
        owner_id=user.owner_id,
        cashier_id=user.id,
        client_id=body.client_id,
        status=status,
        payment_method=body.payment_method,
        total=total,
        discount=body.discount,
        exchange_rate_at_sale=body.exchange_rate_at_sale,
        notes=body.notes,
        cashbox_id=body.cashbox_id,
        paid_at=paid_at,
    )
    db.add(sale)
    await db.flush()  # get sale.id without committing

    sale_items = []
    movements = []
    for item in body.items:
        prod = products[item.product_id]
        prod.stock -= item.quantity

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=prod.id,
            product_name=prod.name,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=round(item.quantity * item.unit_price, 2),
        )
        db.add(sale_item)
        sale_items.append(sale_item)

        movements.append(StockMovement(
            owner_id=user.owner_id,
            product_id=prod.id,
            adjustment=-item.quantity,
            reason="sale",
            user_id=user.id,
        ))

    db.add_all(movements)

    # Update client debt if credit sale
    if body.client_id and status == "pending":
        client_result = await db.execute(
            select(Client).where(
                Client.id == body.client_id,
                Client.owner_id == user.owner_id,
            )
        )
        client = client_result.scalar_one_or_none()
        if client:
            client.total_debt = round(client.total_debt + total, 2)

    await db.commit()
    await db.refresh(sale)
    sale.items = sale_items
    return sale


@router.get("", response_model=list[SaleResponse])
async def list_sales(
    status: Optional[str] = None,
    client_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page_size = min(page_size, 500)
    stmt = select(Sale).where(Sale.owner_id == user.owner_id)
    if status:
        stmt = stmt.where(Sale.status == status)
    if client_id:
        stmt = stmt.where(Sale.client_id == client_id)
    if start_date:
        stmt = stmt.where(Sale.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Sale.created_at <= end_date)
    stmt = stmt.order_by(Sale.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    sales = result.scalars().all()

    for sale in sales:
        items_result = await db.execute(select(SaleItem).where(SaleItem.sale_id == sale.id))
        sale.items = items_result.scalars().all()

    return sales


@router.get("/daily-summary")
async def daily_summary(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date
    today = date.today()
    start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)

    stmt = select(Sale).where(
        Sale.owner_id == user.owner_id,
        Sale.created_at >= start,
        Sale.status != "cancelled",
    )
    result = await db.execute(stmt)
    sales = result.scalars().all()

    revenue = sum(s.total for s in sales if s.status == "paid")
    pending = sum(s.total for s in sales if s.status == "pending")
    count = len(sales)
    avg_ticket = round(revenue / count, 2) if count > 0 else 0

    by_method: dict = {}
    for s in sales:
        m = s.payment_method
        by_method[m] = by_method.get(m, 0) + s.total

    return {
        "revenue": round(revenue, 2),
        "pending_amount": round(pending, 2),
        "count": count,
        "avg_ticket": avg_ticket,
        "by_payment_method": by_method,
    }


@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(
    sale_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sale = await _get_sale_or_404(sale_id, user.owner_id, db)
    return await _load_sale_with_items(sale, db)


@router.patch("/{sale_id}/status", response_model=SaleResponse)
async def update_sale_status(
    sale_id: str,
    body: SaleStatusUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sale = await _get_sale_or_404(sale_id, user.owner_id, db)
    if sale.status == "cancelled":
        raise HTTPException(status_code=400, detail="la venta está cancelada")
    sale.status = body.status
    sale.payment_method = body.payment_method
    if body.status == "paid" and sale.paid_at is None:
        sale.paid_at = datetime.now(timezone.utc)
        # Update client debt
        if sale.client_id:
            client_result = await db.execute(
                select(Client).where(
                    Client.id == sale.client_id,
                    Client.owner_id == user.owner_id,
                )
            )
            client = client_result.scalar_one_or_none()
            if client:
                client.total_debt = max(0.0, round(client.total_debt - sale.total, 2))
    await db.commit()
    await db.refresh(sale)
    return await _load_sale_with_items(sale, db)


@router.post("/{sale_id}/cancel", response_model=SaleResponse)
async def cancel_sale(
    sale_id: str,
    body: CancelRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sale = await _get_sale_or_404(sale_id, user.owner_id, db)
    if sale.status == "cancelled":
        raise HTTPException(status_code=400, detail="la venta ya fue cancelada")

    items_result = await db.execute(select(SaleItem).where(SaleItem.sale_id == sale.id))
    items = items_result.scalars().all()

    # Restore stock atomically
    for item in items:
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        prod = prod_result.scalar_one_or_none()
        if prod:
            prod.stock += item.quantity
            db.add(StockMovement(
                owner_id=user.owner_id,
                product_id=prod.id,
                adjustment=item.quantity,
                reason="correction",
                user_id=user.id,
            ))

    # Update client debt if was pending
    if sale.status == "pending" and sale.client_id:
        client_result = await db.execute(
            select(Client).where(
                Client.id == sale.client_id,
                Client.owner_id == user.owner_id,
            )
        )
        client = client_result.scalar_one_or_none()
        if client:
            client.total_debt = max(0.0, round(client.total_debt - sale.total, 2))

    sale.status = "cancelled"
    sale.cancel_reason = body.reason
    await db.commit()
    await db.refresh(sale)
    sale.items = items
    return sale


@router.post("/clients/{client_id}/pay-all-debts")
async def pay_all_debts(
    client_id: str,
    body: PayAllDebtsRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Sale).where(
            Sale.owner_id == user.owner_id,
            Sale.client_id == client_id,
            Sale.status == "pending",
        )
    )
    pending_sales = result.scalars().all()

    for sale in pending_sales:
        sale.status = "paid"
        sale.payment_method = body.payment_method
        sale.paid_at = now

    # Reset client total_debt
    client_result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.owner_id == user.owner_id,
        )
    )
    client = client_result.scalar_one_or_none()
    if client:
        client.total_debt = 0.0

    await db.commit()
    return {"updated": len(pending_sales)}

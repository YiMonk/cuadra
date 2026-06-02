from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.client import Client
from app.schemas.clients import ClientCreate, ClientResponse, ClientUpdate

router = APIRouter(prefix="/api/v1/clients", tags=["clients"])


async def _get_client_or_404(client_id: str, owner_id: str, db: AsyncSession) -> Client:
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.owner_id == owner_id,
            Client.active == True,
        )
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=404, detail="cliente no encontrado")
    return client


@router.get("", response_model=list[ClientResponse])
async def list_clients(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Client)
        .where(Client.owner_id == user.owner_id, Client.active == True)
        .order_by(Client.name)
    )
    return result.scalars().all()


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_client_or_404(client_id, user.owner_id, db)


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(
    body: ClientCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client = Client(owner_id=user.owner_id, **body.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    body: ClientUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client = await _get_client_or_404(client_id, user.owner_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    await db.commit()
    await db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client = await _get_client_or_404(client_id, user.owner_id, db)
    if client.total_debt > 0:
        raise HTTPException(
            status_code=400,
            detail="no se puede eliminar un cliente con deudas pendientes",
        )
    client.active = False
    await db.commit()

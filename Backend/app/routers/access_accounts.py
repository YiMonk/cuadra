from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_current_user, get_db, require_roles
from app.models.user import User
from app.schemas.access_account import (
    AccessAccountCreate,
    AccessAccountOut,
    AccessAccountPasswordUpdate,
    AccessAccountStatusUpdate,
    AccessAccountUpdate,
)
from app.services import access_account_service, company_service

router = APIRouter(prefix="/api/v1/companies/{company_id}/access-accounts", tags=["access-accounts"])


@router.post(
    "",
    response_model=AccessAccountOut,
    status_code=201,
    dependencies=[Depends(require_roles("owner"))],
)
async def create_access_account(
    company_id: str,
    body: AccessAccountCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    return await access_account_service.create_access_account(db, company_id, body)


@router.get(
    "",
    response_model=list[AccessAccountOut],
    dependencies=[Depends(require_roles("owner"))],
)
async def list_access_accounts(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    return await access_account_service.list_access_accounts(db, company_id)


@router.get(
    "/{account_id}",
    response_model=AccessAccountOut,
    dependencies=[Depends(require_roles("owner"))],
)
async def get_access_account(
    company_id: str,
    account_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    account = await access_account_service.get_access_account_by_id(db, account_id, company_id)
    if not account:
        raise HTTPException(status_code=404, detail="cuenta no encontrada")

    return account


@router.patch(
    "/{account_id}",
    response_model=AccessAccountOut,
    dependencies=[Depends(require_roles("owner"))],
)
async def update_access_account(
    company_id: str,
    account_id: str,
    body: AccessAccountUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    account = await access_account_service.get_access_account_by_id(db, account_id, company_id)
    if not account:
        raise HTTPException(status_code=404, detail="cuenta no encontrada")

    return await access_account_service.update_access_account(db, account, body)


@router.patch(
    "/{account_id}/password",
    response_model=AccessAccountOut,
    dependencies=[Depends(require_roles("owner"))],
)
async def set_account_password(
    company_id: str,
    account_id: str,
    body: AccessAccountPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    account = await access_account_service.get_access_account_by_id(db, account_id, company_id)
    if not account:
        raise HTTPException(status_code=404, detail="cuenta no encontrada")

    return await access_account_service.set_account_password(db, account, body.new_password)


@router.patch(
    "/{account_id}/status",
    response_model=AccessAccountOut,
    dependencies=[Depends(require_roles("owner"))],
)
async def set_account_status(
    company_id: str,
    account_id: str,
    body: AccessAccountStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    account = await access_account_service.get_access_account_by_id(db, account_id, company_id)
    if not account:
        raise HTTPException(status_code=404, detail="cuenta no encontrada")

    return await access_account_service.set_account_status(db, account, body.active)


@router.delete(
    "/{account_id}",
    status_code=405,
    dependencies=[Depends(require_roles("owner"))],
)
async def delete_access_account_not_allowed():
    raise HTTPException(status_code=405, detail="las cuentas no se pueden eliminar")
